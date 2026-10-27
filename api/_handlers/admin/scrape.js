/**
 * /api/admin/scrape.js: On-Demand Job Scraping & Ingestion Handler
 * Dedicated Admin Command Center Endpoint to Trigger Fresh Scraping & Normalization
 * Enforces:
 * 1. 100% Indonesia Local Job Focus (Glints, LinkedIn ID, Jobstreet, BUMN)
 * 2. Strict Seniority & Zero-Slop Filter (Reject Senior/Manager/Lead)
 * 3. SHA-1 Hash Deduplication
 * Node.js ESM Vercel Serverless Function
 */

import { getSupabaseAdmin } from '../../_lib/auth.js';
import { generateJobHash, isFreshGradEligible, normalizeJob } from '../../../scripts/scrape/run.js';
import { runDailySync } from '../../../scripts/scrape/daily-sync.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Memvalidasi kepatuhan satu data lowongan kerja sebelum kurasi/ingesti
 * Menegakkan 5 Aturan Kualitas:
 * 1. Berbadan Hukum (PT, CV, Inc, Corp, Ltd, Tbk, atau nama brand yang jelas, bukan personal name)
 * 2. Email Valid (Domain korporat, bukan email gratisan, bukan no-reply, format regex valid)
 * 3. Freshness (postedAt <= 30 hari)
 * 4. Anti-penipuan (Reject MLM, direct selling, commission only, training fee, bayar, dsb)
 * 5. Kelengkapan (Title, Company, dan minimal satu applyUrl/link atau recruiterEmail)
 * 
 * @param {object} job
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateJobEntry(job) {
  if (!job || typeof job !== 'object') {
    return { valid: false, reason: 'Objek lowongan tidak valid atau bernilai null' };
  }

  const title = (job.title || job.position || '').trim();
  const company = (job.company || job.company_name || '').trim();
  const applyUrl = (job.applyUrl || job.apply_url || job.link || job.url || '').trim();
  const recruiterEmail = (job.recruiterEmail || job.apply_email || job.email || '').trim();

  // ATURAN 5: Kelengkapan
  // Harus punya title, company, dan minimal satu dari (applyUrl ATAU recruiterEmail)
  if (!title) {
    return { valid: false, reason: 'Field judul lowongan (title) wajib diisi' };
  }
  if (!company) {
    return { valid: false, reason: 'Field nama perusahaan (company) wajib diisi' };
  }
  if (!applyUrl && !recruiterEmail) {
    return { valid: false, reason: 'Lowongan harus memiliki minimal satu saluran lamaran (applyUrl/link atau recruiterEmail)' };
  }

  // ATURAN 1: Berbadan Hukum
  // Company name harus mengandung "PT ", "CV ", "Inc", "Corp", "Ltd", "Tbk", atau nama yang jelas (bukan personal name)
  if (company.length < 2) {
    return { valid: false, reason: `Nama perusahaan terlalu pendek atau tidak valid: '${company}'` };
  }
  const INVALID_COMPANY_KEYWORDS = /\b(personal|individu|perorangan|confidential|unknown|n\/a|anonymous|dropshipper|freelance dropshipper|rahasia)\b/i;
  const PERSONAL_PREFIX_REGEX = /^(mr\.|mrs\.|ms\.|dr\.|bapak\s+|ibu\s+|by\s+)/i;
  if (INVALID_COMPANY_KEYWORDS.test(company) || PERSONAL_PREFIX_REGEX.test(company)) {
    return { valid: false, reason: `Nama perusahaan tidak valid atau terindikasi nama personal: '${company}'` };
  }

  // ATURAN 2: Email Valid
  // Jika ada recruiterEmail, harus:
  // - Berdomain perusahaan (bukan gmail.com, yahoo.com, dll untuk public scraping)
  // - Tidak mengandung "noreply", "donotreply", "no-reply"
  // - Format valid dengan regex
  if (recruiterEmail) {
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(recruiterEmail)) {
      return { valid: false, reason: `Format email recruiter tidak valid: '${recruiterEmail}'` };
    }
    const lowerEmail = recruiterEmail.toLowerCase();
    if (/noreply|no-reply|donotreply/.test(lowerEmail)) {
      return { valid: false, reason: `Email perekrut merupakan sistem no-reply otomatis: '${recruiterEmail}'` };
    }
    const domain = lowerEmail.split('@')[1];
    const PUBLIC_FREE_DOMAINS = [
      'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.id', 'yahoo.co.uk',
      'ymail.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
      'icloud.com', 'mail.com', 'proton.me', 'protonmail.com', 'zoho.com', 'aol.com'
    ];
    if (PUBLIC_FREE_DOMAINS.includes(domain)) {
      return { valid: false, reason: `Email perekrut menggunakan domain publik (${domain}), wajib menggunakan email domain korporat resmi` };
    }
  }

  // ATURAN 3: Freshness
  // postedAt tidak lebih dari 30 hari
  const postedAtRaw = job.postedAt || job.posted_at || job.created_at || job.date;
  if (postedAtRaw) {
    let postDate;
    if (typeof postedAtRaw === 'number') {
      postDate = new Date(postedAtRaw > 1e11 ? postedAtRaw : postedAtRaw * 1000);
    } else {
      postDate = new Date(postedAtRaw);
    }
    if (!isNaN(postDate.getTime())) {
      const diffMs = Date.now() - postDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        return { valid: false, reason: `Lowongan kedaluwarsa (diposting ${Math.floor(diffDays)} hari lalu, batas maksimum 30 hari)` };
      }
    }
  }

  // ATURAN 4: Anti-penipuan
  // Skip jika title/description mengandung: "MLM", "direct selling", "commission only", "training fee", "bayar", "investasi awal", "join fee"
  const textToCheck = `${title} ${job.description || ''} ${job.salary || ''}`.toLowerCase();
  const SCAM_PATTERNS = [
    { pattern: /\bmlm\b/i, label: 'MLM' },
    { pattern: /\bdirect selling\b/i, label: 'direct selling' },
    { pattern: /\bcommission only\b/i, label: 'commission only' },
    { pattern: /\btraining fee\b/i, label: 'training fee' },
    { pattern: /\bbayar\b/i, label: 'bayar' },
    { pattern: /\binvestasi awal\b/i, label: 'investasi awal' },
    { pattern: /\bjoin fee\b/i, label: 'join fee' },
    { pattern: /\buang muka\b/i, label: 'uang muka' },
    { pattern: /\bbiaya pendaftaran\b/i, label: 'biaya pendaftaran' }
  ];

  for (const scam of SCAM_PATTERNS) {
    if (scam.pattern.test(textToCheck)) {
      return { valid: false, reason: `Kata kunci penipuan / skema berbayar terdeteksi: '${scam.label}'` };
    }
  }

  return { valid: true, reason: 'Valid' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Baca dataset seed lokal
    const seedPath = path.resolve(__dirname, '../../../clean-live-jobs.json');
    const jobspyPath = path.resolve(__dirname, '../../../scripts/scrape/jobspy-raw-jobs.json');

    let allRawJobs = [];

    if (fs.existsSync(seedPath)) {
      const seedContent = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      const seedJobs = Array.isArray(seedContent) ? seedContent : (seedContent.jobs || []);
      allRawJobs.push(...seedJobs);
    }

    if (fs.existsSync(jobspyPath)) {
      try {
        const jobspyContent = JSON.parse(fs.readFileSync(jobspyPath, 'utf8'));
        if (Array.isArray(jobspyContent)) {
          allRawJobs.push(...jobspyContent);
        }
      } catch (e) {}
    }

    // 2. Normalisasi, Validasi Gate Ketat, Filter Senioritas, dan Filter Khusus Indonesia
    const normalizedMap = new Map();
    let rejectedCount = 0;
    let foreignCount = 0;
    let rejectedValidationCount = 0;

    for (const raw of allRawJobs) {
      const loc = (raw.location || 'Indonesia').toLowerCase();
      // Filter Lokasi: Hanya Indonesia / Remote
      const isIndonesia = /indonesia|jakarta|jawa|bandung|surabaya|yogyakarta|bali|medan|semarang|tangerang|bekasi|bogor|remote/i.test(loc);
      if (!isIndonesia) {
        foreignCount++;
        continue;
      }

      // Validasi gate ketat (5 aturan audit)
      const validation = validateJobEntry(raw);
      if (!validation.valid) {
        rejectedValidationCount++;
        continue;
      }

      const job = normalizeJob(raw);
      if (!job) {
        rejectedCount++;
        continue;
      }

      if (!normalizedMap.has(job.hash)) {
        normalizedMap.set(job.hash, job);
      }
    }

    const uniqueIndonesiaJobs = Array.from(normalizedMap.values());

    // 2b. Jalankan Dimitri HQ Daily Sync Pipeline
    try {
      await runDailySync({ feedJobs: allRawJobs });
    } catch (syncErr) {
      console.warn('[Dimitri HQ Daily Sync Notice]:', syncErr.message);
    }

    // 3. Optional Upsert ke Supabase
    let upsertCount = 0;
    try {
      const supabase = getSupabaseAdmin();
      if (supabase && uniqueIndonesiaJobs.length > 0) {
        const batch = uniqueIndonesiaJobs.slice(0, 100);
        const { error } = await supabase.from('jobs').upsert(batch, { onConflict: 'hash' });
        if (!error) upsertCount = batch.length;
      }
    } catch (dbErr) {
      console.warn('[Admin Scrape Supabase Notice]:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Scraping & kurasi berhasil diperbarui. Total ${uniqueIndonesiaJobs.length} loker lokal Indonesia terverifikasi.`,
      stats: {
        totalIngested: allRawJobs.length,
        verifiedFreshGrad: uniqueIndonesiaJobs.length,
        rejectedValidation: rejectedValidationCount,
        rejectedSeniority: rejectedCount,
        rejectedForeign: foreignCount,
        upsertedToDb: upsertCount,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Admin Scrape Handler Error]:', err);
    return res.status(500).json({
      error: 'Gagal menjalankan pipeline kurasi lowongan kerja.',
      details: err.message
    });
  }
}

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  module.exports.validateJobEntry = validateJobEntry;
}

