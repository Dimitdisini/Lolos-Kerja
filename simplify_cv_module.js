const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Remove "Atau coba draf contoh fresh graduate" block
const presetRegex = /<!-- Preset Persona Universal Fresh Graduate -->[\s\S]*?<\/div>\s*<\/div>\s*(?=<!-- Textarea)/;
if (presetRegex.test(html)) {
  html = html.replace(presetRegex, '');
  console.log("Removed draf contoh preset buttons block");
} else {
  // Fallback string matching
  const startPreset = html.indexOf('<span class="text-xs font-semibold text-slate-600 block">Atau coba draf contoh fresh graduate:</span>');
  if (startPreset !== -1) {
    const endPreset = html.indexOf('<!-- Textarea Editor Pengalaman -->', startPreset);
    if (endPreset !== -1) {
      // Find the closing divs before textarea
      const prevDiv = html.lastIndexOf('</div>', endPreset);
      const outerDiv = html.lastIndexOf('</div>', prevDiv - 1);
      html = html.substring(0, startPreset - 40) + html.substring(endPreset);
      console.log("Removed draf contoh block via string indexing");
    }
  }
}

// 2. Remove socratic probing card (the yellow box "Pertanyaan Penggali Angka & Metrik Riil")
// Keep hidden container for DOM IDs to prevent JS null errors
const socraticRegex = /<!-- Pertanyaan Sokratik -->[\s\S]*?<div id="socraticProbingCard"[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="flex gap-2 pt-1">)/;
if (socraticRegex.test(html)) {
  html = html.replace(socraticRegex, '<div id="socraticProbingCard" class="hidden"><span id="socraticQuestionText"></span><div id="metricChipsContainer"></div></div>\n            ');
  console.log("Hidden/removed yellow socratic probing card");
}

// 3. Clean up the 4 breakdown metrics on the right column
// Keep them visually hidden so JS script doesn't crash on element.innerText
const oldBreakdownMetrics = `              <!-- Breakdown 4 Metrik -->
              <div class="space-y-2 text-xs pt-3 mt-3 border-t border-slate-100">
                <div class="flex justify-between items-center">
                  <span class="text-slate-600">1. Kuantifikasi Hasil (Metrik Angka)</span>
                  <span id="metricScoreText" class="font-bold text-slate-400 font-mono">0/100</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-600">2. Kata Kerja Aksi Kuat (Power Verbs)</span>
                  <span id="verbsScoreText" class="font-bold text-slate-400 font-mono">0/100</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-600">3. Kepadatan Keyword Industri</span>
                  <span id="keywordScoreText" class="font-bold text-slate-400 font-mono">0/100</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-600">4. Parsabilitas Format Polos (Clean Text)</span>
                  <span id="formatScoreText" class="font-bold text-slate-400 font-mono">0/100</span>
                </div>
              </div>`;

const newBreakdownMetrics = `              <!-- Hidden metric trackers for JS integrity -->
              <div class="hidden">
                <span id="metricScoreText">0/100</span>
                <span id="verbsScoreText">0/100</span>
                <span id="keywordScoreText">0/100</span>
                <span id="formatScoreText">0/100</span>
              </div>`;

if (html.includes(oldBreakdownMetrics)) {
  html = html.replace(oldBreakdownMetrics, newBreakdownMetrics);
  console.log("Cleaned up 4 breakdown metrics clutter");
}

// 4. Remove bottom banner "LANGKAH SUKSES MELAMAR SELANJUTNYA" in right column
const nextStepBannerRegex = /<!-- BANNER AKSELERASI KE LANGKAH BERIKUTNYA -->[\s\S]*?<\/div>\s*<\/div>\s*(?=<\/div>\s*<\/div>\s*<\/section>)/;
if (nextStepBannerRegex.test(html)) {
  html = html.replace(nextStepBannerRegex, '');
  console.log("Removed next-step banner clutter from Modul 1");
}

// 5. Update generateHarvardAtsCv so that when CV is empty, it shows clean empty state
const oldGenerateAts = `    function generateHarvardAtsCv() {
      const container = document.getElementById('harvardCvContentDynamic');
      if (!container) return;

      const name = (currentUser && currentUser.isLoggedIn && currentUser.name) ? currentUser.name : 'DIMAS PRATAMA, S.M.';`;

const newGenerateAts = `    function generateHarvardAtsCv() {
      const container = document.getElementById('harvardCvContentDynamic');
      if (!container) return;

      const cvInput = document.getElementById('cvExperienceInput')?.value.trim() || '';
      if (!cvInput && (!document.getElementById('previewAfter') || document.getElementById('previewAfter').textContent.includes('Formula STAR yang siap'))) {
        container.innerHTML = '<div class="py-12 text-center text-slate-400 text-xs space-y-1"><p class="font-semibold text-slate-600">Belum ada draf CV yang dianalisis</p><p>Tempel pengalaman kerjamu di sebelah kiri, lalu klik &quot;Poles Menjadi Standar STAR Berbobot&quot; untuk menghasilkan pratinjau Harvard ATS.</p></div>';
        return;
      }

      const name = (currentUser && currentUser.isLoggedIn && currentUser.name) ? currentUser.name : 'DIMAS PRATAMA, S.M.';`;

if (html.includes(oldGenerateAts)) {
  html = html.replace(oldGenerateAts, newGenerateAts);
  console.log("Updated generateHarvardAtsCv with quiet empty state");
}

fs.writeFileSync(indexPath, html, 'utf8');
if (fs.existsSync(protoPath)) {
  fs.writeFileSync(protoPath, html, 'utf8');
}
console.log("Saved simplified layout successfully!");
