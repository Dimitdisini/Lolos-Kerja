const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Locate and replace the CV input section in Modul 1
const oldCvLeftColumnStart = '<div class="lg:col-span-7 space-y-4">\n          <div class="dospem-card p-5 space-y-4">';
const oldCvLeftColumnEnd = '<div class="flex gap-2 pt-1">\n              <button onclick="applyStarOptimization()"';

const startIndex = html.indexOf(oldCvLeftColumnStart);
const endIndex = html.indexOf('<!-- Kolom Kanan: Rapor Skor ATS', startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find CV Left Column markers");
  process.exit(1);
}

const newCvLeftColumn = `<div class="lg:col-span-7 space-y-4">
          <div class="dospem-card p-5 space-y-4">
            
            <!-- Header Kolom Input & Mode Switcher: Upload File vs Tulis Sendiri -->
            <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                <h3 class="text-xs sm:text-sm font-bold text-slate-800">Metode Input Pengalaman</h3>
              </div>
              
              <!-- Tab Switcher Mode Input (Mencegah tampilan bertumpuk) -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button type="button" id="btnModeUploadCv" onclick="switchCvInputMode('upload')" class="text-xs font-bold px-3 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <span>Unggah Berkas (PDF)</span>
                </button>
                <button type="button" id="btnModeTextCv" onclick="switchCvInputMode('text')" class="text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  <span>Tulis / Tempel Teks</span>
                </button>
              </div>
            </div>

            <!-- Pengaturan Target Posisi & Pengalaman -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-600">Target Posisi Pekerjaan</label>
                  <button type="button" id="btnToggleCustomRole" onclick="toggleCustomRoleInputDirect(true)" class="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
                    + Ketik Posisi Sendiri
                  </button>
                </div>

                <select id="targetRole" onchange="handleTargetRoleChange()" class="dospem-input w-full text-xs rounded-lg p-2.5 font-medium">
                  <optgroup label="Bisnis, Manajemen & Operasional">
                    <option value="business-analyst" selected>Business Analyst / Product Specialist</option>
                    <option value="operations-trainee">Management Trainee (MT) / ODP Generalist</option>
                    <option value="project-officer">Project Management Officer (PMO)</option>
                    <option value="supply-chain">Supply Chain & Logistik Coordinator</option>
                    <option value="hr-talent">HR & Talent Acquisition Associate</option>
                    <option value="legal-officer">Legal & Corporate Compliance</option>
                  </optgroup>
                  <optgroup label="Teknologi, AI & Data">
                    <option value="software-eng">Junior Software Engineer / Web & Mobile</option>
                    <option value="data-analyst">Data Analyst & Business Intelligence</option>
                    <option value="uiux-designer">UI/UX & Product Designer</option>
                    <option value="ai-prompt-eng">AI Prompt & Machine Learning Engineer</option>
                    <option value="qa-tester">QA / Software Tester & Automation</option>
                    <option value="it-support">IT Support, Network & Cloud DevOps</option>
                    <option value="cyber-security">Cyber Security Analyst</option>
                  </optgroup>
                  <optgroup label="Pemasaran, Konten & Penjualan">
                    <option value="digital-marketing">Digital Marketing & Growth Lead</option>
                    <option value="social-media">Social Media Specialist & Content Creator</option>
                    <option value="copywriter">Copywriter & Brand Communications</option>
                    <option value="sales-b2b">Business Development & Sales Executive</option>
                    <option value="pr-comms">Public Relations (PR) & Event Lead</option>
                  </optgroup>
                  <optgroup label="Keuangan, Akuntansi & Perbankan">
                    <option value="finance-accounting">Finance, Tax & Accounting Analyst</option>
                    <option value="tax-specialist">Konsultan Pajak (Tax Specialist)</option>
                    <option value="audit-assurance">Audit & Assurance Associate</option>
                    <option value="credit-analyst">Credit & Risk Analyst</option>
                    <option value="investment-banking">Investment & Banking Operations</option>
                  </optgroup>
                  <optgroup label="Kreatif, Desain & Layanan">
                    <option value="graphic-designer">Graphic Designer & Visual Artist</option>
                    <option value="video-editor">Video Editor & Motion Designer</option>
                    <option value="customer-success">Customer Success & Relationship</option>
                    <option value="hospitality-trainee">Hospitality & Hotel Trainee</option>
                  </optgroup>
                  <optgroup label="Pilihan Lain">
                    <option value="custom">+ Posisi Lainnya (Ketik Sendiri...)</option>
                  </optgroup>
                </select>

                <div id="customRoleInputContainer" class="hidden mt-1.5 flex items-center gap-1.5">
                  <input type="text" id="customTargetRoleInput" oninput="handleCustomRoleInput()" placeholder="Ketik posisi impianmu (misal: HR Specialist, Arsitek)..." class="dospem-input w-full p-2.5 text-xs rounded-lg font-medium bg-white focus:ring-2 focus:ring-blue-500">
                  <button type="button" onclick="toggleCustomRoleInputDirect(false)" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-lg font-bold shrink-0 transition cursor-pointer" title="Kembali ke pilihan daftar">
                    &times; Batal
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Tingkat Pengalaman</label>
                <select id="targetLevel" onchange="runCVAnalysis()" class="dospem-input w-full text-xs rounded-lg p-2.5 font-medium">
                  <option value="fresh-grad">Fresh Graduate (S1 / D4 / D3)</option>
                  <option value="intern">Mahasiswa Tingkat Akhir (Magang)</option>
                  <option value="junior">Junior (1-2 Tahun Pengalaman)</option>
                </select>
              </div>
            </div>

            <!-- ============================================================= -->
            <!-- TAMPILAN MODE A: UNGGAH BERKAS PDF / WORD (DEFAULT)           -->
            <!-- ============================================================= -->
            <div id="cvModeUploadView" class="space-y-3">
              <div id="cvDropzoneContainer" class="relative group">
                <div id="cvScanLaser" class="laser-scanner-line hidden"></div>
                
                <div id="cvDropzoneCard" ondragover="handleCvDragOver(event)" ondragleave="handleCvDragLeave(event)" ondrop="handleCvDrop(event)" class="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white text-center transition-all duration-200 cursor-pointer overflow-hidden shadow-xs hover:shadow-md">
                  
                  <!-- Idle State -->
                  <div id="dropzoneIdleState" class="space-y-3">
                    <div class="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </div>
                    <div>
                      <div class="text-sm sm:text-base font-bold text-slate-900">Tarik & Lepas Berkas CV ke Sini</div>
                      <p class="text-xs text-slate-500 mt-1">Format PDF atau Word (.docx). AI otomatis mengekstrak & merapikan ke standar ATS Harvard.</p>
                    </div>
                    <div class="flex items-center justify-center gap-2 pt-2 flex-wrap">
                      <label for="cvFileUploadInput" onclick="event.stopPropagation();" class="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer shadow-sm transition inline-flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span>Pilih Berkas dari Komputer</span>
                      </label>
                      <input type="file" id="cvFileUploadInput" accept=".pdf,.doc,.docx,.txt" onchange="handleCvFileUpload(event)" class="hidden">
                      <button type="button" onclick="event.stopPropagation(); loadFromGoogleDrivePrompt();" class="text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold px-3.5 py-2 rounded-xl border border-slate-300 shadow-xs transition inline-flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                        <span>Google Drive</span>
                      </button>
                    </div>
                  </div>

                  <!-- Scanning Loading State -->
                  <div id="dropzoneScanningState" class="hidden py-6 space-y-3">
                    <div class="flex items-center justify-center gap-2 text-xs font-bold text-blue-700">
                      <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                      <span id="dropzoneScanStep">Memindai dokumen & mengekstrak metrik angka riil...</span>
                    </div>
                    <div class="w-48 mx-auto bg-blue-100 rounded-full h-1.5 overflow-hidden">
                      <div id="dropzoneScanProgressBar" class="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style="width: 30%"></div>
                    </div>
                  </div>

                  <!-- Uploaded Success File Card State -->
                  <div id="cvUploadedFileSummary" class="hidden p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-left">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                        PDF
                      </div>
                      <div>
                        <div class="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[220px] sm:max-w-xs" id="uploadedFileName">Draf_CV.pdf</div>
                        <div class="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span id="uploadedFileSize">1.2 MB</span>
                          <span class="text-slate-300">&bull;</span>
                          <span class="text-emerald-700 font-bold flex items-center gap-0.5">
                            <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                            100% Terekstraksi ke ATS
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <label for="cvFileUploadInput" onclick="event.stopPropagation();" class="text-xs bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer shadow-2xs">
                        Ganti
                      </label>
                      <button type="button" onclick="event.stopPropagation(); removeUploadedCv();" class="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1.5 rounded-lg hover:bg-red-50">
                        &times; Hapus
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Action button for Mode A -->
              <div class="flex gap-2 pt-1">
                <button type="button" onclick="applyStarOptimization()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                  <span>Poles &amp; Sinkronkan Format Harvard ATS</span>
                </button>
                <button type="button" onclick="resetCVInput()" class="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer">
                  Reset
                </button>
              </div>
            </div>

            <!-- ============================================================= -->
            <!-- TAMPILAN MODE B: TULIS / TEMPEL TEKS SENDIRI                  -->
            <!-- ============================================================= -->
            <div id="cvModeTextView" class="hidden space-y-3">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-semibold text-slate-700">Tuliskan Tugas atau Pengalamanmu:</label>
                  <div class="flex items-center gap-2">
                    <span id="detectedMetricsBadge" class="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-bold">0 Angka Terdeteksi</span>
                    <span id="charCountBadge" class="text-xs text-slate-400 font-mono">0 karakter</span>
                  </div>
                </div>
                <textarea id="cvExperienceInput" oninput="updateCharCount(); runCVAnalysis();" rows="9" class="dospem-input w-full p-3.5 rounded-xl text-xs leading-relaxed font-sans shadow-inner focus:ring-2 focus:ring-blue-500" placeholder="Tuliskan pengalaman organisasi, magang, atau tugas kuliahmu di sini..."></textarea>
              </div>

              <!-- Action button for Mode B -->
              <div class="flex gap-2 pt-1">
                <button type="button" onclick="applyStarOptimization()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                  <span>Poles Menjadi Standar STAR Berbobot</span>
                </button>
                <button type="button" onclick="resetCVInput()" class="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer">
                  Reset
                </button>
              </div>
            </div>

            <!-- Hidden metric & socratic placeholders to preserve JS state -->
            <div id="socraticProbingCard" class="hidden">
              <span id="socraticQuestionText"></span>
              <div id="metricChipsContainer"></div>
            </div>

          </div>
        </div>\n\n        `;

html = html.substring(0, startIndex) + newCvLeftColumn + html.substring(endIndex);
console.log("Successfully replaced CV Left Column with mutually exclusive Mode A vs Mode B!");

// 2. Add switchCvInputMode JS function and integrated next action buttons
const newCvModeJs = `
    function switchCvInputMode(mode) {
      const uploadView = document.getElementById('cvModeUploadView');
      const textView = document.getElementById('cvModeTextView');
      const btnUpload = document.getElementById('btnModeUploadCv');
      const btnText = document.getElementById('btnModeTextCv');

      if (mode === 'text') {
        if (uploadView) uploadView.classList.add('hidden');
        if (textView) textView.classList.remove('hidden');
        if (btnUpload) btnUpload.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer';
        if (btnText) btnText.className = 'text-xs font-bold px-3 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer';
        const textarea = document.getElementById('cvExperienceInput');
        if (textarea) textarea.focus();
      } else {
        if (uploadView) uploadView.classList.remove('hidden');
        if (textView) textView.classList.add('hidden');
        if (btnUpload) btnUpload.className = 'text-xs font-bold px-3 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer';
        if (btnText) btnText.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer';
      }
    }

    function proceedToInterviewFromCv() {
      switchTab('interview-module');
      const roleElem = document.getElementById('targetRole');
      const customRole = document.getElementById('customTargetRoleInput')?.value.trim();
      const roleName = (roleElem && roleElem.value === 'custom' && customRole) ? customRole : (roleElem ? roleElem.options[roleElem.selectedIndex]?.text : 'Junior Business Analyst');
      
      const customInput = document.getElementById('customIvQuestionInput');
      if (customInput) {
        customInput.value = 'Ceritakan pengalaman paling berbobot yang Anda cantumkan di CV untuk posisi ' + roleName + ' ini.';
        if (typeof toggleCustomQuestionForm === 'function') toggleCustomQuestionForm(true);
      }
    }

    function proceedToBlastFromCv() {
      switchTab('blast-module');
    }
`;

if (!html.includes('function switchCvInputMode')) {
  const insertMarker = 'function handleTargetRoleChange() {';
  html = html.replace(insertMarker, newCvModeJs + '\n    ' + insertMarker);
  console.log("Inserted switchCvInputMode & flow action functions!");
}

// 3. Enhance the Right Column (Rapor CV) action buttons:
// Add seamless 1-Click buttons: "Unduh PDF" + "Lanjut: Latihan Interview dari CV Ini" + "Lanjut: Kirim Lamaran ke HRD"
const oldCvRightBottomButtons = `<div class="pt-3 border-t border-slate-100 flex gap-2">
                <button onclick="printHarvardCv()" class="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button onclick="attachHarvardCvToBlast()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  <span>Jadikan Lampiran Modul 4</span>
                </button>
              </div>`;

const newCvRightBottomButtons = `<div class="pt-3 border-t border-slate-100 space-y-2">
                <div class="flex gap-2">
                  <button type="button" onclick="printHarvardCv()" class="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    <span>Unduh PDF Harvard ATS</span>
                  </button>
                  <button type="button" onclick="attachHarvardCvToBlast()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    <span>Lanjut: Kirim Lamaran ke HRD</span>
                  </button>
                </div>

                <!-- 1-Click Direct Pipeline to Interview -->
                <button type="button" onclick="proceedToInterviewFromCv()" class="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
                  <span>Lanjut: Latihan Wawancara dari CV Ini &rarr;</span>
                </button>
              </div>`;

if (html.includes(oldCvRightBottomButtons)) {
  html = html.replace(oldCvRightBottomButtons, newCvRightBottomButtons);
  console.log("Updated Right Column actions with seamless workflow pipeline buttons!");
}

fs.writeFileSync(indexPath, html, 'utf8');
if (fs.existsSync(protoPath)) {
  fs.writeFileSync(protoPath, html, 'utf8');
}
console.log("Updated both files successfully!");
