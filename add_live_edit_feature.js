const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Remove the bulky ROADMAP banner from the bottom of Modul 1
const roadmapRegex = /<!-- ROADMAP KETERHUBUNGAN 4 MODUL LOLOS KERJA[\s\S]*?<\/div>\s*<\/div>\s*(?=<\/div>\s*<\/div>\s*<\/div>\s*<\/section>)/;
if (roadmapRegex.test(html)) {
  html = html.replace(roadmapRegex, '');
  console.log("Removed redundant ROADMAP bottom banner from Modul 1");
}

// 2. Enhance cvTabHarvardContent with Live Edit Toolbar & contenteditable
const oldHarvardDocContainer = `              <!-- KONTEN TAB 2: PRATINJAU CV HARVARD ATS LENGKAP -->
              <div id="cvTabHarvardContent" class="hidden space-y-3">
                <div class="p-4 bg-white border border-slate-300 rounded-xl max-h-80 overflow-y-auto shadow-inner harvard-cv-doc text-xs" id="harvardCvDocContainer">
                  <div id="harvardCvContentDynamic">
                    <!-- Rendered by JS generateHarvardAtsCv() -->
                  </div>
                </div>`;

const newHarvardDocContainer = `              <!-- KONTEN TAB 2: PRATINJAU CV HARVARD ATS LENGKAP (DENGAN LIVE EDIT AKTIF) -->
              <div id="cvTabHarvardContent" class="hidden space-y-2.5">
                <!-- Live Edit Control Bar -->
                <div class="flex items-center justify-between px-1 text-xs flex-wrap gap-2">
                  <div class="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Edit Aktif <span class="text-slate-400 font-normal hidden sm:inline">(Klik teks di lembar CV untuk langsung edit)</span></span>
                  </div>
                  <button type="button" onclick="resetHarvardCvToAi()" class="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer">
                    &circlearrowleft; Reset ke Format AI
                  </button>
                </div>

                <div class="p-4 sm:p-5 bg-white border border-slate-300 rounded-xl max-h-96 overflow-y-auto shadow-inner harvard-cv-doc text-xs cursor-text focus-within:border-blue-500 transition-colors" id="harvardCvDocContainer">
                  <div id="harvardCvContentDynamic" contenteditable="true" oninput="handleHarvardCvLiveEdit()" spellcheck="false" class="focus:outline-none min-h-[220px]">
                    <!-- Rendered by JS generateHarvardAtsCv() -->
                  </div>
                </div>`;

if (html.includes(oldHarvardDocContainer)) {
  html = html.replace(oldHarvardDocContainer, newHarvardDocContainer);
  console.log("Enabled Live Edit on harvardCvContentDynamic!");
} else {
  console.error("Could not find oldHarvardDocContainer");
}

// 3. Add Live Edit state variables and controller functions in JS
const liveEditJs = `
    // =========================================================================
    // HARVARD ATS LIVE INLINE EDITOR CONTROLLER
    // =========================================================================
    let hasUserEditedHarvardCv = false;

    function handleHarvardCvLiveEdit() {
      const container = document.getElementById('harvardCvContentDynamic');
      if (!container) return;
      hasUserEditedHarvardCv = true;
      try {
        localStorage.setItem('dims_harvard_cv_custom_html', container.innerHTML);
      } catch (e) {
        console.error('Failed to auto-save custom CV HTML:', e);
      }
    }

    function resetHarvardCvToAi() {
      hasUserEditedHarvardCv = false;
      try {
        localStorage.removeItem('dims_harvard_cv_custom_html');
      } catch (e) {}
      generateHarvardAtsCv(true);
      const toast = document.getElementById('harvardSyncSuccessPill');
      if (toast) {
        toast.innerText = 'Format CV berhasil dikembalikan ke draf polesan awal AI!';
        toast.classList.remove('hidden');
        setTimeout(() => { toast.classList.add('hidden'); }, 3000);
      }
    }
`;

if (!html.includes('function handleHarvardCvLiveEdit()')) {
  const insertMarker = 'function generateHarvardAtsCv(';
  html = html.replace(insertMarker, liveEditJs + '\n    ' + insertMarker);
  console.log("Inserted Live Edit JS functions!");
}

// 4. Update generateHarvardAtsCv to preserve manual edits unless forced
const oldGenerateSignature = 'function generateHarvardAtsCv() {';
const newGenerateSignature = 'function generateHarvardAtsCv(forceAiReset = false) {';

if (html.includes(oldGenerateSignature)) {
  html = html.replace(oldGenerateSignature, newGenerateSignature);
}

// Check if user has saved custom edits inside generateHarvardAtsCv
const oldGenCheck = `      const cvInput = document.getElementById('cvExperienceInput')?.value.trim() || '';
      if (!cvInput && (!document.getElementById('previewAfter') || document.getElementById('previewAfter').textContent.includes('Formula STAR yang siap'))) {
        container.innerHTML = '<div class="py-12 text-center text-slate-400 text-xs space-y-1"><p class="font-semibold text-slate-600">Belum ada draf CV yang dianalisis</p><p>Tempel pengalaman kerjamu di sebelah kiri, lalu klik &quot;Poles Menjadi Standar STAR Berbobot&quot; untuk menghasilkan pratinjau Harvard ATS.</p></div>';
        return;
      }`;

const newGenCheck = `      // Preserve live edits if user has modified the sheet and not resetting to AI
      if (!forceAiReset && hasUserEditedHarvardCv) {
        try {
          const savedHtml = localStorage.getItem('dims_harvard_cv_custom_html');
          if (savedHtml) {
            container.innerHTML = savedHtml;
            return;
          }
        } catch (e) {}
      }

      const cvInput = document.getElementById('cvExperienceInput')?.value.trim() || '';
      if (!cvInput && (!document.getElementById('previewAfter') || document.getElementById('previewAfter').textContent.includes('Formula STAR yang siap'))) {
        container.innerHTML = '<div class="py-12 text-center text-slate-400 text-xs space-y-1"><p class="font-semibold text-slate-600">Belum ada draf CV yang dianalisis</p><p>Tempel pengalaman kerjamu di sebelah kiri, lalu klik &quot;Poles Menjadi Standar STAR Berbobot&quot; untuk menghasilkan pratinjau Harvard ATS.</p></div>';
        return;
      }`;

if (html.includes(oldGenCheck)) {
  html = html.replace(oldGenCheck, newGenCheck);
  console.log("Updated generateHarvardAtsCv to honor live edits!");
}

fs.writeFileSync(indexPath, html, 'utf8');
if (fs.existsSync(protoPath)) {
  fs.writeFileSync(protoPath, html, 'utf8');
}
console.log("Saved both files successfully!");
