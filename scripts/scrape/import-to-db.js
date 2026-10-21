/**
 * scripts/scrape/import-to-db.js: Scraped Target Ingestion into Supabase PostgreSQL
 * Specification from ANTIGRAVITY-BACKEND-EXECUTION.md Section 4 (Milestone M4)
 * 
 * Rules:
 * - Upserts jobs into public.jobs with email_kind, email_source_url, company_website, role_keys
 * - Deduplication via hash and (lower(company), lower(apply_email))
 * - Email MUST have email_source_url; without it, CANNOT be apply_via='email'
 * - Idempotent: running multiple times does not produce duplicates
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export function normalizeJobForDb(rawJob) {
  const company = (rawJob.company || '').trim();
  const title = (rawJob.title || 'Posisi Terbuka').trim();
  const applyEmail = rawJob.apply_email ? rawJob.apply_email.trim().toLowerCase() : null;
  const sourceUrl = (rawJob.email_source_url || rawJob.source_url || '').trim();
  
  // Rule: apply_via='email' strictly requires a non-empty, valid source_url
  let applyVia = 'portal';
  let emailValid = false;
  let emailKind = rawJob.email_kind || rawJob.kind || null;

  if (applyEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyEmail)) {
    if (sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'))) {
      applyVia = 'email';
      emailValid = true;
      if (!['recruiting', 'general', 'job_posting'].includes(emailKind)) {
        emailKind = 'recruiting';
      }
    } else {
      // Without valid source_url, cannot be email blast target
      applyVia = 'portal';
      emailValid = false;
    }
  }

  const hashSeed = `${company.toLowerCase()}|${title.toLowerCase()}|${applyEmail || (rawJob.apply_url || '')}`;
  const hash = rawJob.hash || crypto.createHash('sha256').update(hashSeed).digest('hex').slice(0, 40);

  return {
    title,
    company,
    company_website: rawJob.company_website || rawJob.website || null,
    location: rawJob.location || 'Indonesia',
    level: rawJob.level || 'fresh-grad',
    category: rawJob.category || 'general',
    majors: Array.isArray(rawJob.majors) ? rawJob.majors : ['Semua Jurusan'],
    skills: Array.isArray(rawJob.skills) ? rawJob.skills : [],
    description: rawJob.description || '',
    apply_email: applyEmail,
    email_kind: emailKind,
    email_source_url: sourceUrl || null,
    email_valid: emailValid,
    email_checked_at: emailValid ? new Date().toISOString() : null,
    apply_url: rawJob.apply_url || rawJob.link || null,
    apply_via: applyVia,
    role_keys: Array.isArray(rawJob.role_keys) ? rawJob.role_keys : [],
    hash,
    is_active: true,
    posted_at: rawJob.posted_at || new Date().toISOString(),
    expires_at: rawJob.expires_at || new Date(Date.now() + 30 * 86400000).toISOString()
  };
}

export function buildDatabaseJobSet(blastTargetsPath, curatedJobsPath) {
  const normalizedJobs = [];
  const seenHashes = new Set();
  const seenCompanyEmails = new Set();

  // 1. Ingest Scraped Blast Targets (High Priority for Verified Emails)
  if (fs.existsSync(blastTargetsPath)) {
    const rawData = JSON.parse(fs.readFileSync(blastTargetsPath, 'utf-8'));
    const targets = Array.isArray(rawData) ? rawData : (rawData.targets || []);

    for (const tgt of targets) {
      const email = tgt.email;
      const sourceUrl = tgt.source_url;
      const jobs = Array.isArray(tgt.jobs) && tgt.jobs.length > 0 ? tgt.jobs : [{ title: 'Posisi Terbuka' }];

      for (const j of jobs) {
        const item = normalizeJobForDb({
          company: tgt.company,
          website: tgt.website,
          apply_email: email,
          kind: tgt.kind,
          source_url: sourceUrl,
          role_keys: tgt.role_keys || j.role_keys || [],
          title: j.title,
          location: j.location,
          apply_url: j.link
        });

        const compEmailKey = `${item.company.toLowerCase()}|${(item.apply_email || '').toLowerCase()}`;
        if (!seenHashes.has(item.hash) && !seenCompanyEmails.has(compEmailKey)) {
          seenHashes.add(item.hash);
          seenCompanyEmails.add(compEmailKey);
          normalizedJobs.push(item);
        }
      }
    }
  }

  // 2. Ingest Curated Loker Portal (Secondary, Portal-based)
  if (fs.existsSync(curatedJobsPath)) {
    const curatedJobs = JSON.parse(fs.readFileSync(curatedJobsPath, 'utf-8'));
    for (const cj of curatedJobs) {
      const item = normalizeJobForDb(cj);
      if (!seenHashes.has(item.hash)) {
        seenHashes.add(item.hash);
        normalizedJobs.push(item);
      }
    }
  }

  return normalizedJobs;
}

export async function importToDatabase(supabaseClient = null) {
  const blastTargetsPath = path.join(rootDir, 'data/blast-targets.json');
  const curatedJobsPath = path.join(rootDir, 'scripts/scrape/curated-clean-jobs.json');

  const jobs = buildDatabaseJobSet(blastTargetsPath, curatedJobsPath);
  console.log(`[INGEST] Siap mengimpor ${jobs.length} loker ke database.`);
  const emailJobs = jobs.filter(j => j.apply_via === 'email');
  console.log(`[INGEST] Lowongan dengan email terverifikasi: ${emailJobs.length}`);

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('jobs')
      .upsert(jobs, { onConflict: 'hash' });

    if (error) {
      console.error('[INGEST ERROR]:', error.message);
      throw error;
    }
    console.log('[INGEST SUCCESS] Loker berhasil di-upsert ke Supabase.');
  }

  return {
    total: jobs.length,
    emailJobs: emailJobs.length,
    portalJobs: jobs.length - emailJobs.length,
    sample: jobs.slice(0, 3)
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importToDatabase().then(res => {
    console.log('Import dry-run selesai:', res);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
