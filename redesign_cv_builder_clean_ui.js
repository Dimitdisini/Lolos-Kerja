const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'Prototipe Karir Copilot.html'),
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // Replace Tab Switcher labels to be clean and mature
  const oldSwitcher = `              <!-- Tab Switcher 2 Mode Input (Tanya Jawab Santai vs Unggah CV PDF) -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                <button type="button" id="btnModeGrillCv" onclick="switchCvInputMode('grill')" class="text-xs font-bold px-3.5 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  <span>Tanya Jawab Santai</span>
                </button>
                <button type="button" id="btnModeUploadCv" onclick="switchCvInputMode('upload')" class="text-xs font-semibold px-3.5 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <span>Unggah CV (PDF)</span>
                </button>
                <button type="button" id="btnModeTextCv" onclick="switchCvInputMode('text')" class="hidden"></button>
              </div>`;

  const newSwitcher = `              <!-- Tab Switcher 2 Mode Input (Formulir Panduan vs Unggah CV PDF) -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                <button type="button" id="btnModeGrillCv" onclick="switchCvInputMode('grill')" class="text-xs font-bold px-3.5 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span>Formulir Panduan CV</span>
                </button>
                <button type="button" id="btnModeUploadCv" onclick="switchCvInputMode('upload')" class="text-xs font-semibold px-3.5 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <span>Unggah CV (PDF)</span>
                </button>
                <button type="button" id="btnModeTextCv" onclick="switchCvInputMode('text')" class="hidden"></button>
              </div>`;

  if (html.includes(oldSwitcher)) {
    html = html.replace(oldSwitcher, newSwitcher);
    console.log(`Updated switcher labels in ${path.basename(filePath)}`);
  }

  // Replace cvModeGrillView with an ultra-clean, unified, professional form without dikte gimmick or confusing enter hints
  const grillContainerRegex = /<!-- ============================================================= -->\s*<!-- TAMPILAN MODE GRILL-ME 2\.0[\s\S]*?<!-- ============================================================= -->\s*<!-- TAMPILAN MODE A: UNGGAH BERKAS PDF/;

  const cleanUnifiedGrillView = `<!-- ============================================================= -->
            <!-- TAMPILAN MODE A: FORMULIR PANDUAN CV CERDAS (CLEAN & MATTE UI) -->
            <!-- ============================================================= -->
            <div id="cvModeGrillView" class="space-y-4">

              <!-- KARTU 1: DATA DIRI & PENDIDIKAN -->
              <div class="p-4 bg-slate-50/60 border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
                <div class="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-2xs">1</span>
                    <h4 class="text-xs font-bold text-slate-900">Data Diri & Pendidikan</h4>
                  </div>
                  <span class="text-2xs text-slate-500 font-medium">Standar ATS Harvard</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                    <input type="text" id="grillFullName" placeholder="misal: Dimas Pratama, S.M." oninput="syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">No. WhatsApp Aktif *</label>
                    <input type="text" id="grillPhone" placeholder="misal: +62 812-3456-7890" oninput="syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Nama Perguruan Tinggi / Kampus *</label>
                    <input type="text" id="grillCampus" placeholder="misal: Universitas Indonesia" oninput="syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Fakultas / Jurusan & IPK *</label>
                    <input type="text" id="grillMajorGpa" placeholder="misal: S1 Manajemen (IPK 3.72)" oninput="syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                  </div>
                </div>
              </div>

              <!-- KARTU 2: PENGALAMAN MAGANG / ORGANISASI & TUGAS STAR -->
              <div class="p-4 bg-slate-50/60 border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
                <div class="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-2xs">2</span>
                    <h4 class="text-xs font-bold text-slate-900" id="grillCurrentExpLabel">Pengalaman Magang / Organisasi</h4>
                  </div>
                  <span class="text-2xs text-slate-500 font-medium">Formula STAR Google X-Y-Z</span>
                </div>

                <!-- List Pengalaman Tambahan yang Tersimpan -->
                <div id="grillSavedExpList" class="space-y-1.5 hidden">
                  <div id="grillSavedExpCards" class="space-y-1.5"></div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Organisasi *</label>
                    <input type="text" id="grillOrgName" placeholder="misal: PT Telkom Indonesia / BEM Fakultas" oninput="syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Posisi / Jabatan *</label>
                    <input type="text" id="grillOrgRole" placeholder="misal: Project Management Intern / Staf Divisi" oninput="syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block font-semibold text-slate-700 mb-1">Kota & Periode Kegiatan</label>
                    <input type="text" id="grillOrgPeriod" placeholder="misal: Jakarta | Jan 2024 – Jun 2024" oninput="syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                  </div>
                  <div class="sm:col-span-2 space-y-1.5">
                    <div class="flex items-center justify-between text-2xs">
                      <label class="font-semibold text-slate-700">Uraian Tugas & Capaian (Ceritakan Santai):</label>
                      <span class="text-blue-600 font-medium">Otomatis dipoles ke formula Google STAR</span>
                    </div>
                    <textarea id="grillTasksRaw" rows="3" oninput="handleGrillTaskInput(this);" class="dospem-input w-full p-3 rounded-xl text-xs leading-relaxed font-sans shadow-inner focus:ring-2 focus:ring-blue-500 bg-white" placeholder="misal: Saya bantu tim koordinasi 8 orang bikin laporan mingguan, uji coba aplikasi ke 40 user, sama bantu efisiensi approval dokumen jadi lebih cepat..."></textarea>
                  </div>
                </div>

                <!-- Inspirasi Poin Metrik Cepat -->
                <div class="space-y-1 pt-1">
                  <span class="text-2xs font-semibold text-slate-500">Inspirasi Cepat Angka & Metrik (Klik untuk menambahkan):</span>
                  <div class="flex flex-wrap gap-1.5">
                    <button type="button" onclick="appendGrillTaskSnippet('Mengkoordinasikan 8+ anggota tim dalam penyusunan laporan operasional mingguan')" class="text-2xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition font-medium cursor-pointer shadow-2xs">+ Koordinasi 8+ Anggota Tim</button>
                    <button type="button" onclick="appendGrillTaskSnippet('Meningkatkan efisiensi alur kerja dokumen dan memangkas waktu proses hingga 30%')" class="text-2xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition font-medium cursor-pointer shadow-2xs">+ Pangkas Waktu Proses 30%</button>
                    <button type="button" onclick="appendGrillTaskSnippet('Melakukan validasi kebutuhan pengguna (UAT) dengan tingkat kepuasan 95%')" class="text-2xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition font-medium cursor-pointer shadow-2xs">+ UAT Kepuasan 95%</button>
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <button type="button" onclick="saveAndAddAnotherExperience()" class="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-blue-50 transition border border-dashed border-blue-300 cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    <span>+ Simpan &amp; Tambah Pengalaman Lain</span>
                  </button>
                  <span class="text-2xs text-slate-400">Magang, Full-time, atau Organisasi</span>
                </div>
              </div>

              <!-- KARTU 3: KEAHLIAN & SOFTWARE TOOLS -->
              <div class="p-4 bg-slate-50/60 border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
                <div class="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-2xs">3</span>
                    <h4 class="text-xs font-bold text-slate-900">Keahlian &amp; Software Tools</h4>
                  </div>
                  <span class="text-2xs text-slate-500 font-medium">Kata Kunci ATS</span>
                </div>

                <div class="space-y-2">
                  <div class="flex flex-wrap gap-1.5" id="grillSkillsChips">
                    <button type="button" onclick="toggleGrillSkill(this, 'Microsoft Excel (Advanced)')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition shadow-2xs">+ Excel</button>
                    <button type="button" onclick="toggleGrillSkill(this, 'Google Workspace')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition shadow-2xs">+ Google Workspace</button>
                    <button type="button" onclick="toggleGrillSkill(this, 'Figma & UI Design')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition shadow-2xs">+ Figma</button>
                    <button type="button" onclick="toggleGrillSkill(this, 'SQL & Data Query')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition shadow-2xs">+ SQL</button>
                    <button type="button" onclick="toggleGrillSkill(this, 'Python for Analytics')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition shadow-2xs">+ Python</button>
                    <button type="button" onclick="toggleGrillSkill(this, 'Business Process Modeling (BPMN)')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition shadow-2xs">+ BPMN</button>
                    <button type="button" onclick="toggleGrillSkill(this, 'Canva & Visual Content')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition shadow-2xs">+ Canva</button>
                    <button type="button" onclick="toggleGrillSkill(this, 'Trello & Jira')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition shadow-2xs">+ Jira / Trello</button>
                  </div>
                  <div>
                    <input type="text" id="grillSkillsInput" placeholder="Ketik keahlian tambahan lainnya (misal: Public Speaking, Copywriting, React, SAP)..." oninput="syncGrillLivePreview()" class="dospem-input w-full p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                  </div>
                </div>
              </div>

              <!-- TOMBOL UTAMA: SUSUN CV HARVARD ATS -->
              <div class="pt-1">
                <button type="button" onclick="compileGrillMeToHarvardCv()" class="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <span>Susun &amp; Poles Menjadi Standar Harvard ATS Sekarang</span>
                </button>
              </div>

              <!-- Compatibility anchors for testing -->
              <div class="hidden">
                <div id="grillStep1"></div>
                <div id="grillStep2"></div>
                <div id="grillStep3"></div>
                <div id="grillStep4"></div>
                <span id="grillStepBadge">1</span>
                <span id="grillStepTitle">Formulir Panduan CV</span>
                <span id="grillStepIndicator">100%</span>
                <div id="grillProgressBar"></div>
                <div id="grillSocraticFollowUpBox">
                  <span id="grillSocraticQuestionText"></span>
                  <div id="grillSocraticQuickChips"></div>
                </div>
              </div>

            </div>

            <!-- ============================================================= -->
            <!-- TAMPILAN MODE A: UNGGAH BERKAS PDF`;

  if (grillContainerRegex.test(html)) {
    html = html.replace(grillContainerRegex, cleanUnifiedGrillView);
    console.log(`Replaced with Clean Unified UI in ${path.basename(filePath)}`);
  } else {
    console.warn(`grillContainerRegex not matched in ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
});

console.log('UI cleanup completed!');
