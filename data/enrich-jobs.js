/**
 * data/enrich-jobs.js: Job Data Quality & Anti-Scam Enrichment Auditor
 * Utilitas audit database kurasi loker Lolos Kerja
 * Memvalidasi kepatuhan terhadap 5 Aturan Kualitas:
 * 1. Berbadan Hukum (PT, CV, Inc, Corp, Ltd, Tbk, nama brand terverifikasi)
 * 2. Email Valid (Domain korporat resmi, bukan domain gratisan/publik, bukan no-reply)
 * 3. Freshness (postedAt <= 30 hari)
 * 4. Anti-penipuan (Reject skema berbayar, MLM, komisi dropship, biaya pelatihan)
 * 5. Kelengkapan (Harus ada title, company, dan saluran applyUrl/recruiterEmail)
 * 
 * Penggunaan:
 *   node data/enrich-jobs.js
 *   node data/enrich-jobs.js --test
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateJobEntry } from '../api/_handlers/admin/scrape.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

/**
 * Memuat dan mengekstrak curatedJobsDatabase langsung dari index.html
 * @returns {Array<object>}
 */
export function loadCuratedJobsFromHtml() {
  const indexPath = path.join(rootDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`File index.html tidak ditemukan di: ${indexPath}`);
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const targetPrefix = 'curatedJobsDatabase = [';
  const startIdx = html.indexOf(targetPrefix);

  if (startIdx === -1) {
    throw new Error('Variabel curatedJobsDatabase tidak ditemukan di dalam index.html');
  }

  const jsonStart = startIdx + 'curatedJobsDatabase = '.length;
  const endIdx = html.indexOf('];', jsonStart);

  if (endIdx === -1) {
    throw new Error('Penutup array curatedJobsDatabase tidak ditemukan di index.html');
  }

  const jsonSlice = html.substring(jsonStart, endIdx + 1);
  return JSON.parse(jsonSlice);
}

/**
 * Menjalankan audit validasi terhadap seluruh lowongan
 * @param {Array<object>} jobsList
 * @returns {object}
 */
export function auditJobs(jobsList) {
  let validCount = 0;
  let invalidCount = 0;
  const invalidReasons = [];

  for (const job of jobsList) {
    const check = validateJobEntry(job);
    if (check.valid) {
      validCount++;
    } else {
      invalidCount++;
      const identifier = job.title || job.position || `Job ID #${job.id}`;
      const company = job.company || job.company_name || 'Tanpa Nama PT';
      invalidReasons.push({
        title: identifier,
        company,
        reason: check.reason
      });
    }
  }

  const total = jobsList.length;
  const validPct = total > 0 ? ((validCount / total) * 100).toFixed(1) : '0.0';
  const invalidPct = total > 0 ? ((invalidCount / total) * 100).toFixed(1) : '0.0';

  return {
    total,
    valid: validCount,
    validPct,
    invalid: invalidCount,
    invalidPct,
    invalidReasons
  };
}

/**
 * Mencetak laporan audit sesuai format standar
 * @param {object} report
 */
export function printReport(report) {
  console.log('=== Job Validation Report ===');
  console.log(`Total jobs: ${report.total}`);
  console.log(`Valid: ${report.valid} (${report.validPct}%)`);
  console.log(`Invalid: ${report.invalid} (${report.invalidPct}%)`);

  if (report.invalidReasons.length > 0) {
    console.log('\nInvalid reasons:');
    for (const item of report.invalidReasons) {
      console.log(`- "${item.title}": ${item.reason}`);
    }
  } else {
    console.log('\nSeluruh lowongan dalam database memenuhi standar kualitas audit (100% Valid).');
  }
}

// Menjalankan script secara langsung via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const isTestMode = process.argv.includes('--test') || process.argv.includes('--demo');
    const jobs = loadCuratedJobsFromHtml();

    // Jika mode test/demo diaktifkan, sertakan sampel sintetis pelanggaran aturan
    if (isTestMode) {
      const syntheticTestCases = [
        {
          id: 'test-scam-1',
          title: 'Freelance Dropshipper XYZ',
          company: 'CV Cuan Cepat',
          link: 'https://example.com/apply',
          description: 'Peluang reseller sistem commission only tanpa modal besar'
        },
        {
          id: 'test-scam-2',
          title: 'Marketing Trainee',
          company: 'PT Sukses Mandiri',
          link: 'https://example.com/apply',
          description: 'Wajib bayar biaya pendaftaran dan training fee diawal'
        },
        {
          id: 'test-scam-3',
          title: 'Direct Selling Executive',
          company: 'PT Multilevel Sukses',
          link: 'https://example.com/apply',
          description: 'Sistem komisi berjenjang MLM dan direct selling produk'
        },
        {
          id: 'test-email-pub',
          title: 'Junior Admin Data',
          company: 'PT Sejahtera Sentosa',
          recruiterEmail: 'hrd.rekrutmen@gmail.com'
        },
        {
          id: 'test-email-noreply',
          title: 'Staff Operasional Gudang',
          company: 'PT Logistik Nasional',
          recruiterEmail: 'noreply@logistiknasional.co.id'
        },
        {
          id: 'test-personal',
          title: 'Customer Service Toko',
          company: 'Personal Budi Santoso',
          link: 'https://example.com/apply'
        },
        {
          id: 'test-expired',
          title: 'Junior Web Developer',
          company: 'PT Solusi Siber',
          link: 'https://example.com/apply',
          postedAt: '2022-01-01'
        },
        {
          id: 'test-incomplete',
          title: 'Accounting Trainee',
          company: 'PT Finansial Unggul'
          // Tanpa link dan tanpa email
        }
      ];
      jobs.push(...syntheticTestCases);
      console.log(`[MODE PENGUJIAN]: Menambahkan ${syntheticTestCases.length} lowongan sintetis untuk validasi aturan.`);
    }

    const report = auditJobs(jobs);
    printReport(report);
  } catch (err) {
    console.error('Fatal Audit Error:', err.message);
    process.exit(1);
  }
}
