/**
 * /scripts/scrape/stats.js: Job Catalog Health & Email-to-Portal Ratio Audit
 * Computes realistic daily blast availability and category distributions.
 * Node.js ESM format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function calculateJobStats(jobs) {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return { total: 0, emailCount: 0, portalCount: 0, emailRatio: 0, categories: {} };
  }

  const total = jobs.length;
  let emailCount = 0;
  let portalCount = 0;
  let validEmailCount = 0;

  const categories = {};
  const levels = {};

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  for (const job of jobs) {
    // 1. Jalur lamar
    const hasEmail = Boolean(job.apply_email || (job.apply_via === 'email'));
    if (hasEmail) {
      emailCount++;
      const email = (job.apply_email || '').trim();
      if (emailRegex.test(email)) {
        validEmailCount++;
      }
    } else {
      portalCount++;
    }

    // 2. Kategori
    const cat = (job.category || 'other').toLowerCase();
    categories[cat] = (categories[cat] || 0) + 1;

    // 3. Level
    const lvl = (job.level || 'Fresh Graduate').toLowerCase();
    levels[lvl] = (levels[lvl] || 0) + 1;
  }

  const emailRatio = ((emailCount / total) * 100).toFixed(1);
  const portalRatio = ((portalCount / total) * 100).toFixed(1);
  const validEmailRatio = emailCount > 0 ? ((validEmailCount / emailCount) * 100).toFixed(1) : 0;

  return {
    total,
    emailCount,
    portalCount,
    emailRatio: Number(emailRatio),
    portalRatio: Number(portalRatio),
    validEmailCount,
    validEmailRatio: Number(validEmailRatio),
    categories,
    levels
  };
}

export function printStatsReport() {
  console.log('=================================================================');
  console.log('       LOLOS KERJA - AUDIT RASIO KATALOG LOKER & EMAIL BLAST     ');
  console.log('=================================================================\n');

  // Cari file dataset
  const curatedPath = path.resolve(__dirname, 'curated-clean-jobs.json');
  const seedPath = path.resolve(__dirname, '../../clean-live-jobs.json');

  const targetFile = fs.existsSync(curatedPath) ? curatedPath : seedPath;

  if (!fs.existsSync(targetFile)) {
    console.error('File katalog loker tidak ditemukan di:', targetFile);
    return;
  }

  console.log(`Membaca dataset dari: ${path.basename(targetFile)}`);
  const rawData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  const jobs = Array.isArray(rawData) ? rawData : (rawData.jobs || []);

  const stats = calculateJobStats(jobs);

  console.log(`\n1. RINGKASAN VOLUME:`);
  console.log(`   - Total Lowongan Pekerjaan Aktif : ${stats.total} loker`);
  console.log(`   - Jalur Email Direct Blast       : ${stats.emailCount} loker (${stats.emailRatio}%)`);
  console.log(`   - Jalur Portal / Web ATS         : ${stats.portalCount} loker (${stats.portalRatio}%)`);
  console.log(`   - Validitas Format Email         : ${stats.validEmailCount}/${stats.emailCount} (${stats.validEmailRatio}%)`);

  console.log(`\n2. DISTRIBUSI KATEGORI:`);
  for (const [cat, count] of Object.entries(stats.categories)) {
    const pct = ((count / stats.total) * 100).toFixed(1);
    console.log(`   - ${cat.padEnd(20)} : ${String(count).padStart(4)} loker (${pct}%)`);
  }

  console.log(`\n3. EVALUASI REALISTIS KAPASITAS BLAST:`);
  const dailyCapacityNeededVIP = 40;
  const daysPool = Math.floor(stats.emailCount / dailyCapacityNeededVIP);
  console.log(`   - Target Paket VIP           : 40 email / hari`);
  console.log(`   - Total Pool Email Tersedia  : ${stats.emailCount} email`);
  console.log(`   - Runway Rotasi Tanpa Dup    : ±${daysPool} hari (sebelum membutuhkan rotasi pool baru)`);

  if (stats.emailCount < 100) {
    console.log(`   [PERINGATAN] Pool email blast < 100. Diperlukan penambahan scraper Apify/BUMN untuk menjaga kuota 30-40/hari.`);
  } else {
    console.log(`   [STATUS SEHAT] Pool email blast mencukupi untuk operasional antrean harian candidate.`);
  }

  console.log('\n=================================================================\n');
}

// Eksekusi jika dijalankan via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  printStatsReport();
}
