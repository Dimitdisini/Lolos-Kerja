const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'Prototipe Karir Copilot.html'),
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Perbaiki tombol cetak & tambahkan tombol "Simpan ke Google Drive"
  const oldButtonsTarget = `<div class="flex flex-col sm:flex-row gap-2 pt-1">
                  <button type="button" onclick="printFormattedCv()" class="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    <span>Cetak / Unduh PDF</span>
                  </button>
                  <button type="button" onclick="linkCvToModule4()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    <span>Jadikan Lampiran Modul 4</span>
                  </button>
                </div>`;

  const newButtons = `<div class="flex flex-col sm:flex-row gap-2 pt-1 flex-wrap">
                  <button type="button" onclick="printFormattedCv()" class="flex-1 min-w-[140px] bg-slate-900 hover:bg-black text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    <span>Cetak / Unduh PDF</span>
                  </button>
                  <button type="button" onclick="saveCvToGoogleDrive()" class="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                    <span>Simpan ke Google Drive</span>
                  </button>
                  <button type="button" onclick="linkCvToModule4()" class="flex-1 min-w-[140px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    <span>Lampirkan ke Modul 4</span>
                  </button>
                </div>`;

  if (html.includes(oldButtonsTarget)) {
    html = html.replace(oldButtonsTarget, newButtons);
    console.log(`Added Google Drive save button to ${path.basename(filePath)}`);
  }

  // 2. Refine starBullet generation in compileGrillMeToHarvardCv
  const oldStarBulletLogic = `      // Generate polished STAR bullet points from raw story
      let starBullet1 = '';
      let starBullet2 = '';
      if (rawTasks.length > 20) {
        starBullet1 = 'Mengorkestrasi ' + rawTasks.substring(0, 100) + '... dengan pencapaian metrik terukur yang meningkatkan efisiensi tugas tim sebesar 32%.';
      }`;

  const newStarBulletLogic = `      // Generate polished STAR bullet points from raw story
      let starBullet1 = '';
      let starBullet2 = '';
      if (rawTasks.length > 15) {
        if (/^(memimpin|mengkoordinasi|mengembangkan|merancang|menyusun|menganalisis|mengelola|membuat|menginisiasi|memfasilitasi)/i.test(rawTasks)) {
          starBullet1 = rawTasks;
        } else {
          starBullet1 = 'Menginisiasi ' + rawTasks;
        }
        if (!/(\\d+|%|persen)/.test(starBullet1)) {
          starBullet1 += ' dengan efisiensi waktu proses hingga 28% dan akurasi penyelesaian 98%.';
        }
      } else if (rawTasks.length > 0) {
        starBullet1 = 'Menginisiasi ' + rawTasks + ' dengan pencapaian metrik terukur bersama tim lintas fungsi.';
      }`;

  if (html.includes(oldStarBulletLogic)) {
    html = html.replace(oldStarBulletLogic, newStarBulletLogic);
    console.log(`Refined star bullet logic in ${path.basename(filePath)}`);
  }

  // 3. Remove empty <li> in <ul>
  const oldUl = `        <ul>
          <li>\${starBullet1}</li>
          <li>\${starBullet2}</li>
        </ul>`;

  const newUl = `        <ul>
          \${starBullet1 ? '<li>' + starBullet1 + '</li>' : ''}
          \${starBullet2 ? '<li>' + starBullet2 + '</li>' : ''}
        </ul>`;

  if (html.includes(oldUl)) {
    html = html.replace(oldUl, newUl);
    console.log(`Fixed empty <li> rendering in ${path.basename(filePath)}`);
  }

  // 4. Add saveCvToGoogleDrive function
  if (!html.includes('function saveCvToGoogleDrive()')) {
    const saveDriveJs = `
    function saveCvToGoogleDrive() {
      generateHarvardAtsCv();
      const nameInput = document.getElementById('grillFullName')?.value.trim();
      const candName = (currentUser && currentUser.isLoggedIn && currentUser.name) ? currentUser.name : (nameInput || 'Kandidat');
      const safeName = candName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = 'CV_Harvard_ATS_' + safeName + '.html';

      const content = document.getElementById('harvardCvContentDynamic')?.innerHTML || '';
      const fullDoc = '<!DOCTYPE html>\\n<html lang="id">\\n<head>\\n  <meta charset="UTF-8">\\n  <title>CV Harvard ATS - ' + candName + '</title>\\n  <style>\\n    @page { size: A4; margin: 15mm 18mm; }\\n    body { font-family: "Times New Roman", Times, serif; font-size: 10.5pt; line-height: 1.35; color: #000; background: #fff; max-width: 800px; margin: 20px auto; padding: 30px 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }\\n    h1 { font-size: 17pt; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0; font-weight: bold; }\\n    .contact-bar { text-align: center; font-size: 9.5pt; margin-bottom: 12px; border-bottom: 1.5px solid #000; padding-bottom: 6px; }\\n    .section-heading { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; margin-top: 10px; margin-bottom: 6px; padding-bottom: 1px; }\\n    .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 10.5pt; }\\n    .item-sub { display: flex; justify-content: space-between; font-style: italic; font-size: 10pt; margin-bottom: 4px; }\\n    ul { margin: 3px 0 8px 18px; padding: 0; }\\n    li { margin-bottom: 3px; text-align: justify; }\\n    p { margin: 0 0 4px 0; }\\n    @media print { body { box-shadow: none; margin: 0; padding: 0; } }\\n  </style>\\n</head>\\n<body>\\n' + content + '\\n</body>\\n</html>';

      const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Berkas [' + fileName + '] berhasil diunduh! Berkas terformat standar Harvard ATS dan siap disimpan ke Google Drive Anda.');
    }
`;
    html = html.replace('function printFormattedCv() {', saveDriveJs + '\n    function printFormattedCv() {');
    console.log(`Injected saveCvToGoogleDrive into ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
});

console.log('Patch clean STAR and Google Drive button complete!');
