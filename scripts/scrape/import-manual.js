/**
 * scripts/scrape/import-manual.js: Manual Verified Target Ingestion
 * Specification from ANTIGRAVITY-BACKEND-EXECUTION.md Section 4 (Milestone M4)
 * 
 * Rules:
 * - Reads data/manual-targets.csv (company,email,source_url,role_keys,notes)
 * - MANDATORY source_url: Rows without valid HTTP/HTTPS source_url are strictly REJECTED
 * - Validates email syntax
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeJobForDb } from './import-to-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export function parseManualTargetsCsv(csvContent) {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return { accepted: [], rejected: [] };

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const companyIdx = header.indexOf('company');
  const emailIdx = header.indexOf('email');
  const sourceUrlIdx = header.indexOf('source_url');
  const roleKeysIdx = header.indexOf('role_keys');

  const accepted = [];
  const rejected = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(',').map(c => c.trim());
    const company = cols[companyIdx] || '';
    const email = cols[emailIdx] || '';
    const sourceUrl = cols[sourceUrlIdx] || '';
    const roleKeysRaw = cols[roleKeysIdx] || '';

    // Validation rules
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const sourceUrlValid = Boolean(sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')));

    if (!company) {
      rejected.push({ line: i, raw: rawLine, reason: 'Nama perusahaan tidak boleh kosong' });
      continue;
    }

    if (!emailValid) {
      rejected.push({ line: i, raw: rawLine, reason: 'Format email tidak valid' });
      continue;
    }

    if (!sourceUrlValid) {
      rejected.push({ line: i, raw: rawLine, reason: 'Wajib menyertakan source_url resmi (http/https)' });
      continue;
    }

    const roleKeys = roleKeysRaw ? roleKeysRaw.split('|').map(r => r.trim()).filter(Boolean) : [];

    const job = normalizeJobForDb({
      company,
      apply_email: email,
      source_url: sourceUrl,
      role_keys: roleKeys,
      title: `Lowongan Terbuka - ${company}`,
      kind: 'recruiting'
    });

    accepted.push(job);
  }

  return { accepted, rejected };
}

export async function importManualTargets(csvPath = path.join(rootDir, 'data/manual-targets.csv'), supabaseClient = null) {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Berkas CSV tidak ditemukan di: ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const { accepted, rejected } = parseManualTargetsCsv(content);

  console.log(`[MANUAL IMPORT] Baris valid diterima: ${accepted.length}`);
  console.log(`[MANUAL IMPORT] Baris ditolak: ${rejected.length}`);
  if (rejected.length > 0) {
    rejected.forEach(r => console.warn(`   [REJECTED line ${r.line}]: ${r.reason}`));
  }

  if (supabaseClient && accepted.length > 0) {
    const { error } = await supabaseClient
      .from('jobs')
      .upsert(accepted, { onConflict: 'hash' });

    if (error) {
      console.error('[MANUAL IMPORT ERROR]:', error.message);
      throw error;
    }
    console.log('[MANUAL IMPORT SUCCESS] Kontak manual berhasil disimpan ke database.');
  }

  return { accepted, rejected };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importManualTargets().then(res => {
    console.log('Import manual targets selesai.');
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
