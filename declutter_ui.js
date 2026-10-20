const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Clean up Hero tags clutter (lines ~530: "Powered By Model AI Pill Tags")
const heroTagsOld = `        <!-- Powered By Model AI Pill Tags -->
        <div class="hidden sm:flex pt-2 flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span class="font-medium mr-1">Didukung oleh:</span>
          <span class="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-semibold text-slate-700">Formula STAR Google X-Y-Z</span>
          <span class="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-semibold text-slate-700">Harvard ATS Standard</span>
          <span class="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-semibold text-slate-700">Web Audio Analyser</span>
          <span class="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-semibold text-slate-700">Live Scraped Jobs</span>
        </div>`;

if (html.includes(heroTagsOld)) {
  html = html.replace(heroTagsOld, '');
  console.log("Removed Hero pill tags clutter");
}

// 2. Remove the bulky 4-card STAR guide accordion in Modul 1 (CV)
// Keep the section clean and straight to the workspace
const starDetailsRegex = /<!-- PANDUAN FORMULA STAR & GOOGLE X-Y-Z[\s\S]*?<\/details>/;
if (starDetailsRegex.test(html)) {
  html = html.replace(starDetailsRegex, '');
  console.log("Removed bulky STAR details guide from Modul 1");
}

// 3. Remove verbose subtitle in Modul 1 Header
const oldCvSubtitle = `          <p class="hidden sm:block text-xs sm:text-sm text-slate-600">
            Audit skor kesiapan parsing mesin ATS secara presisi. Ubah draf pengalaman pasif menjadi kalimat pencapaian berformula STAR Google X-Y-Z yang siap diekspor menjadi lampiran resmi Modul 4.
          </p>`;
const newCvSubtitle = `          <p class="hidden sm:block text-xs sm:text-sm text-slate-500">
            Tempel pengalaman kerja atau unggah CV. Sistem otomatis mengubahnya ke standar ATS Harvard.
          </p>`;
if (html.includes(oldCvSubtitle)) {
  html = html.replace(oldCvSubtitle, newCvSubtitle);
  console.log("Simplified Modul 1 subtitle");
}

// 4. Remove verbose subtitle in Modul 2 Header
const oldIvSubtitle = `          <p class="hidden sm:block text-xs sm:text-sm text-slate-600">
            Latihan bicara langsung menggunakan mikrofon browser dengan visualizer minimalis ala Apple. Menilai kesesuaian formula STAR dan mengaudit kata gumam (<em>'aaa/eee/kayak'</em>) secara transparan.
          </p>`;
const newIvSubtitle = `          <p class="hidden sm:block text-xs sm:text-sm text-slate-500">
            Latihan bicara langsung dengan mikrofon. Deteksi filler words dan evaluasi relevansi jawaban.
          </p>`;
if (html.includes(oldIvSubtitle)) {
  html = html.replace(oldIvSubtitle, newIvSubtitle);
  console.log("Simplified Modul 2 subtitle");
}

// 5. Remove verbose subtitle in Modul 4 Header & redundant trust badge banner
const oldBlastSubtitle = `          <p class="hidden sm:block text-xs sm:text-sm text-slate-600">
            Kirim lamaran kerja terpersonalisasi dengan jeda cerdas (45-90s) langsung ke Inbox HRD terverifikasi. Lampirkan CV milikmu (PDF/Word) atau gunakan draf hasil rapikan CV secara langsung.
          </p>`;
const newBlastSubtitle = `          <p class="hidden sm:block text-xs sm:text-sm text-slate-500">
            Pilih posisi dan perusahaan tujuan. Lamaran dikirim langsung ke kontak rekrutmen resmi.
          </p>`;
if (html.includes(oldBlastSubtitle)) {
  html = html.replace(oldBlastSubtitle, newBlastSubtitle);
  console.log("Simplified Modul 4 subtitle");
}

const trustBadgeOld = `      <!-- TRUST & DELIVERY BADGE (COMPACT & REASSURING) -->
      <div class="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
        <div class="flex items-center gap-2 text-slate-700 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span><strong>Kirim Resmi &amp; Aman:</strong> Email dikirim langsung dari akun Anda dengan jeda alami anti-spam (45-90s) ke kontak rekrutmen terverifikasi. Bisa langsung kirim tanpa bedah CV.</span>
        </div>
        <span class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-xs shrink-0">Bebas &amp; Langsung</span>
      </div>`;

if (html.includes(trustBadgeOld)) {
  html = html.replace(trustBadgeOld, '');
  console.log("Removed redundant trust badge banner from Modul 4");
}

fs.writeFileSync(indexPath, html, 'utf8');
if (fs.existsSync(protoPath)) {
  fs.writeFileSync(protoPath, html, 'utf8');
}
console.log("Refactored index.html and Prototipe Karir Copilot.html successfully!");
