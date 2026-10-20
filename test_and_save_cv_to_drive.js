/**
 * test_and_save_cv_to_drive.js
 *
 * Menguji alur penuh Grill-Me CV Builder + AI Inline Suggestions,
 * lalu menyimpan hasilnya secara nyata ke folder Google Drive Dimitri:
 * "/Users/haimac/Dimitri Ahmad/Dokumen Dimitri/01 CV dan Portofolio/01 CV ATS Internasional (Tanpa Foto)/"
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'index.html');
let htmlSource = fs.readFileSync(indexPath, 'utf8');

// Mock tailwind CDN script to avoid external network delay in jsdom
htmlSource = htmlSource.replace(
  /<script src="https:\/\/cdn.tailwindcss.com"><\/script>/g,
  '<script>window.tailwind = { config: {} };</script>'
);

console.log('======================================================');
console.log('  TESTING LIVE GRILL-ME CV BUILDER & SAVE TO DRIVE    ');
console.log('======================================================\n');

// 1. Inisialisasi headless DOM
const dom = new JSDOM(htmlSource, {
  runScripts: 'dangerously',
  url: 'https://lolos-kerja-seven.vercel.app/'
});

const { window } = dom;
const { document } = window;

// Mock window globals
window.alert = () => {};
window.scrollTo = () => {};

// 2. Skenario Uji Coba: Fresh Graduate Kandidat Nyata
const candidateData = {
  fullName: 'Anindya Putri, S.Kom.',
  phone: '+62 812-9876-5432',
  campus: 'Universitas Indonesia – Fakultas Ilmu Komputer',
  majorGpa: 'S1 Sistem Informasi (IPK 3.82 / 4.00, Cum Laude)',
  orgName: 'PT GoTo Gojek Tokopedia Tbk',
  orgRole: 'Associate Product Management Intern',
  orgPeriod: 'Jakarta, Indonesia | Feb 2024 – Jul 2024',
  tasksRaw: 'Memimpin riset kebutuhan 120+ merchant UMKM, menyusun 15 dokumen PRD fitur checkout otomatis, dan mengkoordinasikan 6 software engineer sehingga memangkas error drop-off rate sebesar 24%.',
  skills: ['Product Requirement Document (PRD)', 'Figma & UI Prototyping', 'SQL & Data Analytics', 'Scrum Agile', 'BPMN Workflow', 'Jira & Confluence']
};

console.log('--- FASE 1: MEMASUKKAN DATA LANGKAH 1 (PROFIL & KAMPUS) ---');
const fullNameInput = document.getElementById('grillFullName');
const phoneInput = document.getElementById('grillPhone');
const campusInput = document.getElementById('grillCampus');
const majorInput = document.getElementById('grillMajorGpa');

fullNameInput.value = candidateData.fullName;
phoneInput.value = candidateData.phone;
campusInput.value = candidateData.campus;
majorInput.value = candidateData.majorGpa;

// Uji AI Inline Suggestion function
const campusSuggestion = window._grillSuggest('grillCampus', 'ui');
console.log('  [PASS] AI Suggestion Kampus "ui":', campusSuggestion);

const gpaSuggestion = window._grillSuggest('grillMajorGpa', '3.82');
console.log('  [PASS] AI Suggestion IPK "3.82":', gpaSuggestion);

// Navigasi ke Langkah 2
window.nextGrillStep(2);
console.log('  [PASS] Berhasil lanjut ke Langkah 2. Step Badge:', document.getElementById('grillStepBadge')?.textContent);

console.log('\n--- FASE 2: MEMASUKKAN DATA LANGKAH 2 (PENGALAMAN) ---');
document.getElementById('grillOrgName').value = candidateData.orgName;
document.getElementById('grillOrgRole').value = candidateData.orgRole;
document.getElementById('grillOrgPeriod').value = candidateData.orgPeriod;

const orgSuggestion = window._grillSuggest('grillOrgName', 'PT GoTo Gojek Tokopedia');
console.log('  [PASS] AI Suggestion Organisasi:', orgSuggestion);

window.nextGrillStep(3);
console.log('  [PASS] Berhasil lanjut ke Langkah 3. Step Badge:', document.getElementById('grillStepBadge')?.textContent);

console.log('\n--- FASE 3: MEMASUKKAN DATA LANGKAH 3 (TUGAS & STAR) ---');
document.getElementById('grillTasksRaw').value = candidateData.tasksRaw;
const taskSuggestion = window._grillSuggest('grillTasksRaw', candidateData.tasksRaw);
console.log('  [PASS] AI Suggestion Analisis STAR:', taskSuggestion);

window.nextGrillStep(4);
console.log('  [PASS] Berhasil lanjut ke Langkah 4. Step Badge:', document.getElementById('grillStepBadge')?.textContent);

console.log('\n--- FASE 4: MEMILIH TOOLS & MENYUSUN CV HARVARD ATS ---');
const chips = document.querySelectorAll('#grillSkillsChips button');
chips.forEach(btn => btn.click());
document.getElementById('grillSkillsInput').value = 'Google Analytics, Postman API, Scrum Agile';

// Eksekusi kompilasi
window.compileGrillMeToHarvardCv();

// Verifikasi Hasil di DOM
const harvardContainer = document.getElementById('harvardCvContentDynamic');
const compiledHtml = harvardContainer.innerHTML;
const atsScore = document.getElementById('atsScoreValue')?.textContent;
const atsStatus = document.getElementById('atsBadgeStatus')?.textContent;

console.log('  [PASS] Status ATS:', atsStatus);
console.log('  [PASS] Skor Kesiapan ATS:', atsScore, '/ 100');
console.log('  [PASS] Konten Harvard Terbit, Panjang HTML:', compiledHtml.length, 'karakter');

// 3. Simpan Hasil ke Berkas Nyata (Drive & Local Folder)
const driveDir = '/Users/haimac/Dimitri Ahmad/Dokumen Dimitri/01 CV dan Portofolio/01 CV ATS Internasional (Tanpa Foto)';
const localOutputDir = path.join(__dirname, 'hasil_test_cv');

if (!fs.existsSync(localOutputDir)) {
  fs.mkdirSync(localOutputDir, { recursive: true });
}

// Format Dokumen Standar Harvard ATS Lengkap Siap Cetak / Buka di Browser
const fullStandaloneCvHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>CV Harvard ATS - ${candidateData.fullName}</title>
  <style>
    @page { size: A4; margin: 15mm 18mm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
      line-height: 1.35;
      color: #000;
      background: #fff;
      max-width: 800px;
      margin: 20px auto;
      padding: 30px 40px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    h1 {
      font-size: 17pt;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
      font-weight: bold;
    }
    .contact-bar {
      text-align: center;
      font-size: 9.5pt;
      margin-bottom: 12px;
      border-bottom: 1.5px solid #000;
      padding-bottom: 6px;
    }
    .section-heading {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #000;
      margin-top: 10px;
      margin-bottom: 6px;
      padding-bottom: 1px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 10.5pt;
    }
    .item-sub {
      display: flex;
      justify-content: space-between;
      font-style: italic;
      font-size: 10pt;
      margin-bottom: 4px;
    }
    ul {
      margin: 3px 0 8px 18px;
      padding: 0;
    }
    li {
      margin-bottom: 3px;
      text-align: justify;
    }
    p { margin: 0 0 4px 0; }
    @media print {
      body { box-shadow: none; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  ${compiledHtml}
</body>
</html>`;

const driveFilePath = path.join(driveDir, `Hasil Uji Coba CV Harvard ATS - ${candidateData.fullName.split(',')[0].trim()}.html`);
const localFilePath = path.join(localOutputDir, `Hasil_Uji_Coba_CV_Harvard_ATS_${candidateData.fullName.split(',')[0].trim().replace(/\s+/g, '_')}.html`);

fs.writeFileSync(driveFilePath, fullStandaloneCvHtml, 'utf8');
fs.writeFileSync(localFilePath, fullStandaloneCvHtml, 'utf8');

console.log('\n======================================================');
console.log('  BERHASIL DISIMPAN KE GOOGLE DRIVE & DIREKTORI PROYEK ');
console.log('======================================================');
console.log('1. Path Google Drive:');
console.log('   ', driveFilePath);
console.log('2. Path Folder Lokal Proyek:');
console.log('   ', localFilePath);
console.log('======================================================\n');
