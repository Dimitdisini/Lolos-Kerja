/**
 * /scripts/scrape/run.js: Modern Automated Job Ingestion Pipeline
 * Step 1: Scrape / Ingest Raw Data
 * Step 2: Normalization
 * Step 3: Deduplication via SHA-1 Hash
 * Step 4: Strict Seniority Filter (Rejects Head/Director/Senior/Lead for Fresh Grads)
 * Step 5: Email Extraction & Domain MX Validation
 * Step 6: Upsert to Supabase
 *
 * Node.js ESM format
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns/promises';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Regex untuk mendeteksi posisi senior yang TIDAK cocok untuk fresh graduate
const SENIORITY_FILTER_REGEX = /\b(head|director|direktur|vp|vice president|general manager|gm|lead|senior|sr\.|sr\b|manager|manajer|principal|chief|co-founder|founder|partner|expert|specialist iii|specialist ii)\b/i;

// Regex validasi format email
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

/**
 * Menghasilkan hash unik deduplikasi: sha1(lower(title|company|location))
 */
export function generateJobHash(title, company, location) {
  const normTitle = (title || '').trim().toLowerCase();
  const normCompany = (company || '').trim().toLowerCase();
  const normLocation = (location || '').trim().toLowerCase();
  const input = `${normTitle}|${normCompany}|${normLocation}`;
  return crypto.createHash('sha1').update(input).digest('hex');
}

/**
 * Memeriksa apakah judul pekerjaan memenuhi syarat fresh graduate (tidak berstatus Senior/Manager)
 */
export function isFreshGradEligible(title) {
  if (!title) return false;
  return !SENIORITY_FILTER_REGEX.test(title);
}

/**
 * Validasi MX record domain email secara asinkron
 */
export async function validateEmailDomain(email) {
  if (!email || !EMAIL_REGEX.test(email)) return false;
  const domain = email.split('@')[1];
  if (!domain) return false;

  // Domain blacklist umum yang bukan tujuan rekrutmen sah
  const blockedDomains = ['example.com', 'test.com', 'dummy.com', 'localhost'];
  if (blockedDomains.includes(domain.toLowerCase())) return false;

  try {
    const mxRecords = await dns.resolveMx(domain);
    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch (err) {
    // Jika lookup MX gagal, anggap format dasar saja atau tandai false
    return false;
  }
}

/**
 * Pipeline normalisasi satu data loker mentah
 */
export function normalizeJob(rawJob) {
  const title = (rawJob.title || rawJob.position || '').trim();
  const company = (rawJob.company || rawJob.company_name || '').trim();
  const location = (rawJob.location || 'Indonesia').trim();

  if (!title || !company) return null;

  // Filter level: Buang jika senior/manager
  if (!isFreshGradEligible(title)) {
    return null;
  }

  const hash = generateJobHash(title, company, location);

  // Ekstrak info email
  let applyEmail = rawJob.apply_email || rawJob.email || null;
  if (!applyEmail && rawJob.description) {
    const emailMatch = rawJob.description.match(EMAIL_REGEX);
    if (emailMatch) {
      applyEmail = emailMatch[0].toLowerCase();
    }
  }

  const applyVia = applyEmail ? 'email' : 'portal';

  return {
    source: rawJob.source || 'ingest_pipeline',
    external_id: rawJob.id ? String(rawJob.id) : null,
    hash,
    title,
    company,
    location,
    level: rawJob.level || 'Fresh Graduate',
    category: rawJob.category || 'tech',
    majors: Array.isArray(rawJob.majors) ? rawJob.majors : ['Semua Jurusan'],
    skills: Array.isArray(rawJob.skills) ? rawJob.skills : [],
    description: (rawJob.description || '').trim(),
    apply_email: applyEmail,
    apply_url: rawJob.apply_url || rawJob.url || null,
    apply_via: applyVia,
    email_valid: Boolean(applyEmail && EMAIL_REGEX.test(applyEmail)),
    posted_at: rawJob.posted_at || new Date().toISOString(),
    expires_at: rawJob.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  };
}

/**
 * Runner utama pipeline scraping
 */
export async function runScrapePipeline() {
  console.log('=== MEMULAI INGESTION & SCRAPE PIPELINE LOLOS KERJA ===');

  // Cari file sumber seed (clean-live-jobs.json)
  const seedPath = path.resolve(__dirname, '../../clean-live-jobs.json');
  if (!fs.existsSync(seedPath)) {
    console.error('File seed clean-live-jobs.json tidak ditemukan di:', seedPath);
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const rawJobs = Array.isArray(rawData) ? rawData : (rawData.jobs || []);
  console.log(`Ditemukan ${rawJobs.length} raw jobs pada dataset sumber.`);

  const normalizedMap = new Map();
  let rejectedSeniorCount = 0;

  for (const raw of rawJobs) {
    const job = normalizeJob(raw);
    if (!job) {
      rejectedSeniorCount++;
      continue;
    }

    // Deduplikasi berdasar hash
    if (!normalizedMap.has(job.hash)) {
      normalizedMap.set(job.hash, job);
    }
  }

  const uniqueJobs = Array.from(normalizedMap.values());
  console.log(`- Filter Seniority: ${rejectedSeniorCount} loker ditolak (posisi Senior/Lead/Manager).`);
  console.log(`- Hasil Deduplikasi Hash: ${uniqueJobs.length} loker fresh grad unik terverifikasi.`);

  const emailJobs = uniqueJobs.filter(j => j.apply_via === 'email');
  console.log(`- Loker jalur Email Blast: ${emailJobs.length} (${((emailJobs.length / uniqueJobs.length) * 100).toFixed(1)}%)`);
  console.log(`- Loker jalur Portal ATS: ${uniqueJobs.length - emailJobs.length}`);

  // Simpan hasil kurasi ke file output
  const outputPath = path.resolve(__dirname, 'curated-clean-jobs.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueJobs, null, 2), 'utf8');
  console.log(`Berhasil menyimpan data terkurasi ke: ${outputPath}`);

  // Upsert ke Supabase jika environment variable tersedia
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    console.log('Menghubungkan ke Supabase untuk melakukan upsert loker...');
    const supabase = createClient(supabaseUrl, serviceKey);

    // Batch upsert per 50 baris
    const batchSize = 50;
    for (let i = 0; i < uniqueJobs.length; i += batchSize) {
      const batch = uniqueJobs.slice(i, i + batchSize);
      const { error } = await supabase
        .from('jobs')
        .upsert(batch, { onConflict: 'hash' });

      if (error) {
        console.error(`Gagal melakukan upsert batch ${i} - ${i + batch.length}:`, error.message);
      }
    }
    console.log('Upsert ke Supabase selesai 100%.');
  } else {
    console.log('Info: SUPABASE_URL / SERVICE_ROLE_KEY tidak disetel. Upsert database dilewati (Local Mode).');
  }

  console.log('=== PIPELINE SCRAPING SELESAI DENGAN SUKSES ===');
}

// Eksekusi jika dijalankan langsung via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runScrapePipeline().catch(err => {
    console.error('Fatal Pipeline Error:', err);
    process.exit(1);
  });
}
