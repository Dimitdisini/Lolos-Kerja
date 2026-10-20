const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'index.html');
let htmlSource = fs.readFileSync(indexPath, 'utf8');

htmlSource = htmlSource.replace(
  /<script src="https:\/\/cdn.tailwindcss.com"><\/script>/g,
  '<script>window.tailwind = { config: {} };</script>'
);

const dom = new JSDOM(htmlSource, {
  runScripts: 'dangerously',
  url: 'https://lolos-kerja-seven.vercel.app/'
});

const { window } = dom;
const { document } = window;
window.alert = () => {};
window.scrollTo = () => {};

// Data Asli Dimitri Ahmad
const dimitriData = {
  fullName: 'Dimitri Ahmad Saefullah Sidik, S.T.',
  phone: '+62 812-2220-0012',
  email: 'dimitriahmad000@gmail.com',
  campus: 'Universitas Telkom – Fakultas Teknik Elektro',
  majorGpa: 'S1 Teknik Fisika (IPK 3.69 / 4.00, Sangat Memuaskan)',
  orgName: 'PT Xavortree Digital Solution & PT Fleek Group Indonesia',
  orgRole: 'Lead Technology Architect & Co-Founder',
  orgPeriod: 'Bandung & Jakarta, Indonesia | 2023 – Sekarang',
  tasksRaw: 'Mengarsitektur sistem e-commerce supply chain tertutup Gocean B2B dan orkestrasi multi-agent enterprise AI n8n yang memangkas latensi alur operasional sebesar 38% serta meningkatkan efisiensi settlement supplier.',
  skills: ['Sistem Instrumentasi & Sensor IoT', 'Arsitektur RAG & Multi-Agent AI', 'Keycloak IAM & RBAC', 'BPMN Workflow Modeling', 'Docker VPS & Supabase', 'Python & TypeScript', 'PostgreSQL']
};

document.getElementById('grillFullName').value = dimitriData.fullName;
document.getElementById('grillPhone').value = dimitriData.phone;
document.getElementById('grillCampus').value = dimitriData.campus;
document.getElementById('grillMajorGpa').value = dimitriData.majorGpa;

document.getElementById('grillOrgName').value = dimitriData.orgName;
document.getElementById('grillOrgRole').value = dimitriData.orgRole;
document.getElementById('grillOrgPeriod').value = dimitriData.orgPeriod;
document.getElementById('grillTasksRaw').value = dimitriData.tasksRaw;

// Toggle chips
const chips = document.querySelectorAll('#grillSkillsChips button');
chips.forEach(btn => btn.click());
document.getElementById('grillSkillsInput').value = dimitriData.skills.join(', ');

// Target role
const roleSelect = document.getElementById('targetRole');
if (roleSelect) {
  roleSelect.value = 'software-eng';
}

window.compileGrillMeToHarvardCv();

const compiledHtml = document.getElementById('harvardCvContentDynamic').innerHTML;

const fullStandaloneCvHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>CV Harvard ATS - ${dimitriData.fullName}</title>
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

const driveDir = '/Users/haimac/Dimitri Ahmad/Dokumen Dimitri/01 CV dan Portofolio/01 CV ATS Internasional (Tanpa Foto)';
const driveFilePath = path.join(driveDir, 'Hasil Uji Coba CV Harvard ATS - Dimitri Ahmad.html');
const localFilePath = path.join(__dirname, 'hasil_test_cv', 'Hasil_Uji_Coba_CV_Harvard_ATS_Dimitri_Ahmad.html');

fs.writeFileSync(driveFilePath, fullStandaloneCvHtml, 'utf8');
fs.writeFileSync(localFilePath, fullStandaloneCvHtml, 'utf8');

console.log('Dimitri test CV saved successfully to:');
console.log('1. ', driveFilePath);
console.log('2. ', localFilePath);
