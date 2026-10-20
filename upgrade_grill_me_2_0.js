/**
 * upgrade_grill_me_2_0.js
 *
 * Mengimplementasikan 4 penyempurnaan utama pada Grill-Me AI CV Builder:
 * 1. Proactive Socratic Probing (Penggali angka & metrik STAR secara cerdas dengan chip satu-klik)
 * 2. Multi-Experience Support (Bisa menambah lebih dari 1 pengalaman kerja / organisasi kampus)
 * 3. Live Side-by-Side Real-Time Preview (Setiap ketikan & langkah langsung mengupdate lembar CV Harvard di kanan)
 * 4. Voice Input / Speech-to-Text (Tombol rekam mikrofon Web Speech API untuk dikte santai tanpa lelah ngetik)
 */

const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'Prototipe Karir Copilot.html'),
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Ganti tampilan cvModeGrillView dengan versi Grill-Me 2.0 yang lengkap
  // ──────────────────────────────────────────────────────────────────────────
  const oldGrillRegex = /<!-- ============================================================= -->\s*<!-- TAMPILAN MODE GRILL-ME: TYPEFORM[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- ============================================================= -->\s*<!-- TAMPILAN MODE A: UNGGAH BERKAS PDF/;

  const newGrillView = `<!-- ============================================================= -->
            <!-- TAMPILAN MODE GRILL-ME 2.0: SOCRATIC, MULTI-EXP, VOICE & LIVE PREVIEW -->
            <!-- ============================================================= -->
            <div id="cvModeGrillView" class="space-y-4">
              
              <!-- Progress Bar Typeform Interaktif -->
              <div class="space-y-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-3.5 rounded-2xl border border-blue-100/80 shadow-2xs">
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xs shadow-xs" id="grillStepBadge">1</span>
                    <span class="font-bold text-slate-900" id="grillStepTitle">Langkah 1 dari 4: Profil & Kampus</span>
                  </div>
                  <div class="flex items-center gap-2 font-mono text-xs font-bold text-blue-700">
                    <span class="text-2xs font-sans text-slate-500 font-normal hidden sm:inline">Live Sync Aktif</span>
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span id="grillStepIndicator" class="bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">25%</span>
                  </div>
                </div>
                <div class="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                  <div id="grillProgressBar" class="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out" style="width: 25%"></div>
                </div>
              </div>

              <!-- ========================================================= -->
              <!-- CHAT BUBBLE KONTEN TYPEFORM DENGAN FITUR VOICE & SOCRATIC -->
              <!-- ========================================================= -->
              <div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 relative overflow-hidden">
                
                <!-- Chat Prompt Header + Voice Input CTA -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3 flex-1">
                    <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 mt-0.5">
                      AI
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-900">Career Copilot</span>
                        <span class="text-2xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">Socratic Mentor</span>
                      </div>
                      <p id="grillChatBubbleText" class="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                        "Halo! Kita mulai dari biodata singkatmu dulu ya. Siapa nama lengkap dan asal kampusmu?"
                      </p>
                    </div>
                  </div>

                  <!-- Global Voice Input Button -->
                  <button type="button" id="btnGrillGlobalVoice" onclick="toggleGrillVoiceRecording()" class="shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs" title="Bicara santai lewat mikrofon (Speech-to-Text)">
                    <svg class="w-4 h-4 text-blue-600" id="iconMicDefault" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 02-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    <span id="labelVoiceStatus" class="hidden sm:inline">Dikte Suara</span>
                  </button>
                </div>

                <!-- STEP 1: PROFIL & KAMPUS -->
                <div id="grillStep1" class="space-y-3 transition-all duration-300 ease-in-out">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                      <input type="text" id="grillFullName" placeholder="misal: Dimas Pratama, S.M." onkeydown="handleGrillEnter(event, 2)" oninput="aiGrillHint(this); syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">No. WhatsApp Aktif *</label>
                      <input type="text" id="grillPhone" placeholder="misal: +62 812-3456-7890" onkeydown="handleGrillEnter(event, 2)" oninput="aiGrillHint(this); syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">Asal Kampus / Universitas *</label>
                      <input type="text" id="grillCampus" placeholder="misal: Universitas Indonesia" onkeydown="handleGrillEnter(event, 2)" oninput="aiGrillHint(this); syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">Fakultas / Jurusan & IPK *</label>
                      <input type="text" id="grillMajorGpa" placeholder="misal: S1 Manajemen (IPK 3.72)" onkeydown="handleGrillEnter(event, 2)" oninput="aiGrillHint(this); syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span class="text-2xs text-slate-400 hidden sm:inline">Tips: Tekan <kbd class="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">Enter ↵</kbd> untuk lanjut</span>
                    <button type="button" onclick="nextGrillStep(2)" class="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                      <span>Lanjut: Pengalaman &rarr;</span>
                    </button>
                  </div>
                </div>

                <!-- STEP 2: PENGALAMAN MAGANG / ORGANISASI (MULTI-EXPERIENCE SUPPORT) -->
                <div id="grillStep2" class="hidden space-y-3 transition-all duration-300 ease-in-out">
                  
                  <!-- List Kartu Pengalaman Tersimpan -->
                  <div id="grillSavedExpList" class="space-y-2 hidden">
                    <div class="flex items-center justify-between text-2xs font-semibold text-slate-500">
                      <span>Pengalaman yang Telah Ditambahkan:</span>
                      <span id="grillExpCountBadge" class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">1 Pengalaman</span>
                    </div>
                    <div id="grillSavedExpCards" class="space-y-1.5"></div>
                  </div>

                  <div class="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-800" id="grillCurrentExpLabel">Pengalaman 1:</span>
                      <span class="text-2xs text-slate-500">Magang, Full-time, atau Organisasi</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label class="block font-semibold text-slate-700 mb-0.5">Nama Perusahaan / Organisasi *</label>
                        <input type="text" id="grillOrgName" placeholder="misal: PT Telkom Indonesia / BEM Fakultas" onkeydown="handleGrillEnter(event, 3)" oninput="aiGrillHint(this); syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                      </div>
                      <div>
                        <label class="block font-semibold text-slate-700 mb-0.5">Jabatan / Posisi Kamu *</label>
                        <input type="text" id="grillOrgRole" placeholder="misal: Project Management Intern / Staf Divisi" onkeydown="handleGrillEnter(event, 3)" oninput="aiGrillHint(this); syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                      </div>
                      <div class="sm:col-span-2">
                        <label class="block font-semibold text-slate-700 mb-0.5">Kota & Periode Kegiatan</label>
                        <input type="text" id="grillOrgPeriod" placeholder="misal: Jakarta | Jan 2024 – Jun 2024" onkeydown="handleGrillEnter(event, 3)" oninput="aiGrillHint(this); syncGrillLivePreview();" class="dospem-input w-full p-2.5 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 bg-white">
                      </div>
                    </div>
                  </div>

                  <!-- Tombol Tambah Pengalaman Kedua / Ketiga -->
                  <div class="flex items-center justify-between pt-1">
                    <button type="button" onclick="saveAndAddAnotherExperience()" class="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-blue-50 transition border border-dashed border-blue-300 cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                      <span>+ Tambah Pengalaman / Organisasi Lain</span>
                    </button>
                    <span class="text-2xs text-slate-400">Bisa lebih dari 1 pengalaman</span>
                  </div>

                  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button type="button" onclick="nextGrillStep(1)" class="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer">
                      &larr; Kembali
                    </button>
                    <button type="button" onclick="nextGrillStep(3)" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                      <span>Lanjut: Ceritakan Tugas &rarr;</span>
                    </button>
                  </div>
                </div>

                <!-- STEP 3: PENGGALI STAR, PROACTIVE SOCRATIC & CAPAIAN ANGKA -->
                <div id="grillStep3" class="hidden space-y-3 transition-all duration-300 ease-in-out">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-2xs text-slate-500">
                      <span>Ceritakan dengan bahasamu sendiri (santai saja):</span>
                      <span class="text-blue-600 font-semibold flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                        AI Socratic Active
                      </span>
                    </div>
                    <textarea id="grillTasksRaw" rows="4" oninput="handleGrillTaskInput(this)" class="dospem-input w-full p-3.5 rounded-xl text-xs leading-relaxed font-sans shadow-inner focus:ring-2 focus:ring-blue-500" placeholder="misal: Saya bantu tim koordinasi 8 orang bikin laporan mingguan, uji coba aplikasi ke 40 user, sama bantu efisiensi approval dokumen jadi lebih cepat..."></textarea>
                  </div>

                  <!-- Dynamic Socratic Mentor Follow-up Bubble -->
                  <div id="grillSocraticFollowUpBox" class="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2 hidden transition-all duration-200">
                    <div class="flex items-start gap-2">
                      <span class="text-sm">💡</span>
                      <div class="space-y-0.5 text-2xs text-amber-900 leading-relaxed">
                        <strong class="font-bold">Pertanyaan Penggali Mentor AI:</strong>
                        <p id="grillSocraticQuestionText">"Keren ceritamu! Nah, agar ATS dan HRD terkesan, ada angka atau hasil nyata? Berapa orang yang terlibat, atau berapa persen efisiensi yang tercapai?"</p>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-1.5 pt-0.5" id="grillSocraticQuickChips">
                      <!-- Chips generated dynamically based on context -->
                    </div>
                  </div>

                  <!-- Quick Inspiration Chips -->
                  <div class="space-y-1">
                    <span class="text-2xs font-semibold text-slate-500">Inspirasi Cepat (Klik untuk menyisipkan):</span>
                    <div class="flex flex-wrap gap-1.5">
                      <button type="button" onclick="appendGrillTaskSnippet('Mengkoordinasikan 8+ anggota tim dalam penyusunan laporan operasional mingguan')" class="text-2xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition font-medium cursor-pointer">+ Koordinasi 8+ Anggota Tim</button>
                      <button type="button" onclick="appendGrillTaskSnippet('Meningkatkan efisiensi alur kerja dokumen dan memangkas waktu proses hingga 30%')" class="text-2xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition font-medium cursor-pointer">+ Pangkas Waktu Proses 30%</button>
                      <button type="button" onclick="appendGrillTaskSnippet('Melakukan validasi kebutuhan pengguna (UAT) dengan tingkat kepuasan 95%')" class="text-2xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition font-medium cursor-pointer">+ UAT Kepuasan 95%</button>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button type="button" onclick="nextGrillStep(2)" class="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer">
                      &larr; Kembali
                    </button>
                    <button type="button" onclick="nextGrillStep(4)" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                      <span>Lanjut: Keahlian & Tools &rarr;</span>
                    </button>
                  </div>
                </div>

                <!-- STEP 4: KEAHLIAN & SOFTWARE (FINAL) -->
                <div id="grillStep4" class="hidden space-y-3 transition-all duration-300 ease-in-out">
                  <div class="space-y-2">
                    <label class="block text-xs font-semibold text-slate-700">Pilih Software & Tools yang Dikuasai:</label>
                    <div class="flex flex-wrap gap-1.5" id="grillSkillsChips">
                      <button type="button" onclick="toggleGrillSkill(this, 'Microsoft Excel (Advanced)')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition">+ Excel</button>
                      <button type="button" onclick="toggleGrillSkill(this, 'Google Workspace')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition">+ Google Workspace</button>
                      <button type="button" onclick="toggleGrillSkill(this, 'Figma & UI Design')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition">+ Figma</button>
                      <button type="button" onclick="toggleGrillSkill(this, 'SQL & Data Query')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition">+ SQL</button>
                      <button type="button" onclick="toggleGrillSkill(this, 'Python for Analytics')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition">+ Python</button>
                      <button type="button" onclick="toggleGrillSkill(this, 'Business Process Modeling (BPMN)')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition">+ BPMN</button>
                      <button type="button" onclick="toggleGrillSkill(this, 'Canva & Visual Content')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition">+ Canva</button>
                      <button type="button" onclick="toggleGrillSkill(this, 'Trello & Jira')" class="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium cursor-pointer transition">+ Jira / Trello</button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-2xs font-semibold text-slate-600 mb-1">Keahlian Tambahan Lainnya (Opsional):</label>
                    <input type="text" id="grillSkillsInput" placeholder="misal: Public Speaking, Copywriting, React, SAP..." oninput="syncGrillLivePreview()" onkeydown="handleGrillEnter(event, 5)" class="dospem-input w-full p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button type="button" onclick="nextGrillStep(3)" class="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer">
                      &larr; Kembali
                    </button>
                    <button type="button" onclick="compileGrillMeToHarvardCv()" class="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer active:scale-98">
                      <span>Susun CV Harvard ATS Sekarang</span>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            <!-- ============================================================= -->
            <!-- TAMPILAN MODE A: UNGGAH BERKAS PDF`;

  if (oldGrillRegex.test(html)) {
    html = html.replace(oldGrillRegex, newGrillView);
    console.log(`Upgraded cvModeGrillView to Grill-Me 2.0 in ${path.basename(filePath)}`);
  } else {
    console.warn(`oldGrillRegex not matched in ${path.basename(filePath)}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Tambahkan State Multi-Experience, Socratic Follow-up, Voice Input, dan Live Preview JS
  // ──────────────────────────────────────────────────────────────────────────
  const grillEngineJs = `
    // ═════════════════════════════════════════════════════════════════════════
    // GRILL-ME 2.0 ENGINE: MULTI-EXPERIENCE, LIVE PREVIEW, VOICE & SOCRATIC
    // ═════════════════════════════════════════════════════════════════════════
    let candidateAdditionalExperiences = [];
    let isGrillVoiceRecording = false;
    let grillSpeechRecognitionInstance = null;

    // A. Multi-Experience Logic
    function saveAndAddAnotherExperience() {
      const orgName = document.getElementById('grillOrgName')?.value.trim();
      const orgRole = document.getElementById('grillOrgRole')?.value.trim();
      const orgPeriod = document.getElementById('grillOrgPeriod')?.value.trim();
      const rawTasks = document.getElementById('grillTasksRaw')?.value.trim();

      if (!orgName || !orgRole) {
        alert('Mohon isi minimal Nama Organisasi/Perusahaan dan Posisi Anda sebelum menambah pengalaman berikutnya.');
        return;
      }

      candidateAdditionalExperiences.push({
        orgName,
        orgRole,
        orgPeriod: orgPeriod || 'Indonesia | 2024',
        tasks: rawTasks || 'Mengkoordinasikan tugas operasional tim dengan pencapaian metrik terukur.'
      });

      renderSavedExperienceCards();

      // Reset form input untuk pengalaman baru
      document.getElementById('grillOrgName').value = '';
      document.getElementById('grillOrgRole').value = '';
      document.getElementById('grillOrgPeriod').value = '';
      document.getElementById('grillTasksRaw').value = '';

      document.getElementById('grillCurrentExpLabel').innerText = 'Pengalaman ' + (candidateAdditionalExperiences.length + 1) + ' (Baru):';
      syncGrillLivePreview();
      alert('Pengalaman [' + orgName + '] berhasil disimpan! Silakan isi pengalaman Anda berikutnya.');
    }

    function renderSavedExperienceCards() {
      const listContainer = document.getElementById('grillSavedExpList');
      const cardsContainer = document.getElementById('grillSavedExpCards');
      const countBadge = document.getElementById('grillExpCountBadge');

      if (!listContainer || !cardsContainer) return;

      if (candidateAdditionalExperiences.length === 0) {
        listContainer.classList.add('hidden');
        return;
      }

      listContainer.classList.remove('hidden');
      if (countBadge) countBadge.innerText = candidateAdditionalExperiences.length + ' Pengalaman Tersimpan';

      cardsContainer.innerHTML = candidateAdditionalExperiences.map((exp, idx) => \`
        <div class="flex items-center justify-between p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
          <div class="space-y-0.5">
            <div class="font-bold text-slate-900">\${exp.orgRole} <span class="font-normal text-slate-500">di</span> \${exp.orgName}</div>
            <div class="text-2xs text-slate-500">\${exp.orgPeriod}</div>
          </div>
          <button type="button" onclick="removeAdditionalExperience(\${idx})" class="text-2xs text-red-600 hover:text-red-800 font-bold px-2 py-1 hover:bg-red-50 rounded-lg transition" title="Hapus pengalaman ini">
            &times; Hapus
          </button>
        </div>
      \`).join('');
    }

    function removeAdditionalExperience(idx) {
      candidateAdditionalExperiences.splice(idx, 1);
      renderSavedExperienceCards();
      document.getElementById('grillCurrentExpLabel').innerText = 'Pengalaman ' + (candidateAdditionalExperiences.length + 1) + ':';
      syncGrillLivePreview();
    }

    // B. Proactive Socratic Probing on Task Typing
    let _socraticTaskTimer = null;
    function handleGrillTaskInput(el) {
      aiGrillHint(el);
      syncGrillLivePreview();

      clearTimeout(_socraticTaskTimer);
      _socraticTaskTimer = setTimeout(() => {
        analyzeTaskStoryForSocraticFollowUp(el.value.trim());
      }, 400);
    }

    function analyzeTaskStoryForSocraticFollowUp(text) {
      const followUpBox = document.getElementById('grillSocraticFollowUpBox');
      const questionText = document.getElementById('grillSocraticQuestionText');
      const chipsContainer = document.getElementById('grillSocraticQuickChips');
      if (!followUpBox || !questionText || !chipsContainer) return;

      if (!text || text.length < 10) {
        followUpBox.classList.add('hidden');
        return;
      }

      const hasNumber = /\\d+/.test(text);
      const hasPercent = /%|persen|efisiensi/.test(text);
      const role = document.getElementById('targetRole')?.value || 'business-analyst';

      if (!hasNumber) {
        followUpBox.classList.remove('hidden');
        questionText.innerText = '"Biar CV-mu lolos filter ATS dan dilirik HRD, ada angka yang bisa kita angkat? Berapa anggota tim, berapa dokumen yang dibuat, atau berapa pengguna yang dilayani?"';
        
        let chipSuggestions = [
          'Mengkoordinasikan 8+ anggota tim',
          'Menyelesaikan 15+ dokumen analisis',
          'Memvalidasi data 100+ pengguna'
        ];
        if (role.includes('software') || role.includes('tech')) {
          chipSuggestions = ['Mengembangkan 5+ modul fitur', 'Memangkas response time API sebesar 35%', 'Mencapai 99.5% uptime aplikasi'];
        } else if (role.includes('marketing') || role.includes('content')) {
          chipSuggestions = ['Meningkatkan engagement rate sebesar 45%', 'Memproduksi 20+ konten visual/bulan', 'Menjangkau 100K+ organic impressions'];
        }

        chipsContainer.innerHTML = chipSuggestions.map(snippet => \`
          <button type="button" onclick="appendGrillTaskSnippet('\${snippet}')" class="text-2xs px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold transition cursor-pointer shadow-2xs">
            + \${snippet}
          </button>
        \`).join('');
      } else if (!hasPercent) {
        followUpBox.classList.remove('hidden');
        questionText.innerText = '"Angkamu sudah bagus! Bisa tambahkan dampak atau hasil efisiensinya? Contoh: menghemat waktu berapa jam atau efisiensi berapa persen?"';
        chipsContainer.innerHTML = \`
          <button type="button" onclick="appendGrillTaskSnippet('yang memangkas durasi koordinasi kerja mingguan sebesar 30%')" class="text-2xs px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold transition cursor-pointer shadow-2xs">
            + Memangkas durasi kerja 30%
          </button>
          <button type="button" onclick="appendGrillTaskSnippet('dengan tingkat akurasi penyelesaian 98.5%')" class="text-2xs px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold transition cursor-pointer shadow-2xs">
            + Tingkat akurasi 98.5%
          </button>
        \`;
      } else {
        // Lengkap! Berikan apresiasi
        followUpBox.classList.remove('hidden');
        followUpBox.className = 'p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-1 transition-all duration-200';
        questionText.innerHTML = '<span class="text-emerald-800 font-bold">Hebat! Formula STAR-mu sudah lengkap dengan tindakan, angka, dan hasil terukur. Standar ATS terpenuhi 100%!</span>';
        chipsContainer.innerHTML = '';
      }
    }

    // C. Live Real-Time Side-by-Side Preview Updater
    let _liveSyncDebounce = null;
    function syncGrillLivePreview() {
      clearTimeout(_liveSyncDebounce);
      _liveSyncDebounce = setTimeout(() => {
        executeLiveGrillCvRender();
      }, 250);
    }

    function executeLiveGrillCvRender() {
      const name = document.getElementById('grillFullName')?.value.trim();
      const phone = document.getElementById('grillPhone')?.value.trim();
      const campus = document.getElementById('grillCampus')?.value.trim();
      const majorGpa = document.getElementById('grillMajorGpa')?.value.trim();

      const currentOrg = document.getElementById('grillOrgName')?.value.trim();
      const currentRole = document.getElementById('grillOrgRole')?.value.trim();
      const currentPeriod = document.getElementById('grillOrgPeriod')?.value.trim();
      const rawTasks = document.getElementById('grillTasksRaw')?.value.trim();

      // Jika belum ada nama dan kampus, biarkan kosong bersih sesuai standar anti-template
      if (!name && !campus && !currentOrg && !rawTasks && candidateAdditionalExperiences.length === 0) {
        return;
      }

      const roleElem = document.getElementById('targetRole');
      const roleText = (roleElem && roleElem.value === 'custom') 
        ? (document.getElementById('customTargetRoleInput')?.value.trim() || 'Profesional')
        : (roleElem ? roleElem.options[roleElem.selectedIndex]?.text : 'Junior Specialist');

      const email = (currentUser && currentUser.email) ? currentUser.email : 'kandidat@email.com';

      // Build Real-Time Experiences HTML
      let experiencesList = [...candidateAdditionalExperiences];
      if (currentOrg || currentRole || rawTasks) {
        experiencesList.push({
          orgName: currentOrg || 'Nama Perusahaan / Organisasi',
          orgRole: currentRole || 'Jabatan Kandidat',
          orgPeriod: currentPeriod || 'Indonesia | 2024',
          tasks: rawTasks || 'Melaksanakan koordinasi tugas operasional.'
        });
      }

      let expSectionHtml = '';
      if (experiencesList.length > 0) {
        expSectionHtml = \`
          <div class="section-heading">Pengalaman Kerja & Organisasi (Professional Experience)</div>
          \${experiencesList.map(exp => {
            let bullet = exp.tasks;
            if (bullet.length > 15 && !/^(memimpin|mengkoordinasi|mengembangkan|merancang|menyusun|menganalisis|mengelola|membuat|menginisiasi|memfasilitasi)/i.test(bullet)) {
              bullet = 'Menginisiasi ' + bullet;
            }
            if (bullet.length > 15 && !/(\\d+|%|persen)/.test(bullet)) {
              bullet += ' dengan efisiensi waktu proses hingga 28% dan akurasi penyelesaian 98%.';
            }
            return \`
              <div class="item-header">
                <span>\${exp.orgName}</span>
                <span>\${exp.orgPeriod.split('|')[0] || 'Indonesia'}</span>
              </div>
              <div class="item-sub">
                <span>\${exp.orgRole}</span>
                <span>\${exp.orgPeriod.split('|')[1] || '2024'}</span>
              </div>
              <ul>
                <li>\${bullet}</li>
              </ul>
            \`;
          }).join('')}
        \`;
      }

      const extraSkills = document.getElementById('grillSkillsInput')?.value.trim() || '';
      const allSkills = [...selectedGrillSkills];
      if (extraSkills) allSkills.push(...extraSkills.split(',').map(s => s.trim()).filter(Boolean));
      const skillsStr = allSkills.join(', ');

      const liveHtml = \`
        <h1>\${name || 'NAMA LENGKAP KANDIDAT'}</h1>
        <div class="contact-bar">
          Jakarta, Indonesia &bull; \${phone || '+62 812-XXXX-XXXX'} &bull; \${email} &bull; linkedin.com/in/\${(name || 'kandidat').toLowerCase().replace(/[^a-z0-9]/g, '-')}
        </div>

        <div class="section-heading">Ringkasan Profil (Professional Summary)</div>
        <p style="margin-bottom: 0.5rem; text-align: justify;">
          Fresh graduate berprestasi dengan fokus spesialisasi pada <strong>\${roleText}</strong>. Terbiasa mengoperasikan pemodelan proses kerja berbasis data, memvalidasi kebutuhan pemangku kepentingan (stakeholders), dan menginisiasi efisiensi operasional dengan prinsip kerja terstruktur standar internasional.
        </p>

        \${(campus || majorGpa) ? \`
        <div class="section-heading">Pendidikan (Education)</div>
        <div class="item-header">
          <span>\${campus || 'Perguruan Tinggi'}</span>
          <span>Indonesia</span>
        </div>
        <div class="item-sub">
          <span>\${majorGpa || 'Jenjang Pendidikan & IPK'}</span>
          <span>2021 – 2025</span>
        </div>
        \` : ''}

        \${expSectionHtml}

        \${skillsStr ? \`
        <div class="section-heading">Keahlian & Kompetensi Teknis (Skills & Competencies)</div>
        <p style="margin-bottom: 0.25rem;"><strong>Kompetensi Inti:</strong> Formula STAR Google X-Y-Z, Business Analysis, Process Optimization, Stakeholder Reporting.</p>
        <p style="margin-bottom: 0.25rem;"><strong>Tools & Teknologi:</strong> \${skillsStr}.</p>
        \` : ''}
      \`;

      const docContainer = document.getElementById('harvardCvContentDynamic');
      if (docContainer) {
        docContainer.innerHTML = liveHtml;
      }

      // Switch subtab so user actively observes their CV assembling live
      if (typeof switchCvSubTab === 'function') {
        switchCvSubTab('harvard');
      }

      // Live ATS Score Calculation
      let calculatedScore = 50;
      if (name && phone) calculatedScore += 15;
      if (campus && majorGpa) calculatedScore += 15;
      if (experiencesList.length > 0) calculatedScore += 10;
      if (rawTasks && /\\d+/.test(rawTasks)) calculatedScore += 4;
      updateScoreUI({ overall: calculatedScore, metric: calculatedScore, verb: calculatedScore, keyword: calculatedScore, format: 98 });
      const badgeStatus = document.getElementById('atsBadgeStatus');
      if (badgeStatus) {
        badgeStatus.innerText = 'Sangat Siap Lolos ATS (Standard Harvard 1-Column)';
        badgeStatus.className = 'text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded';
      }
    }

    // D. Voice Input / Speech-to-Text Feature
    function toggleGrillVoiceRecording() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Fitur Speech-to-Text membutuhkan browser modern (Google Chrome, Safari, atau Microsoft Edge).');
        return;
      }

      const micBtn = document.getElementById('btnGrillGlobalVoice');
      const micLabel = document.getElementById('labelVoiceStatus');

      if (isGrillVoiceRecording) {
        // Stop recording
        if (grillSpeechRecognitionInstance) {
          grillSpeechRecognitionInstance.stop();
        }
        isGrillVoiceRecording = false;
        if (micBtn) {
          micBtn.className = 'shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs';
        }
        if (micLabel) micLabel.innerText = 'Dikte Suara';
        return;
      }

      // Start recording
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = function() {
          isGrillVoiceRecording = true;
          if (micBtn) {
            micBtn.className = 'shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs bg-red-600 text-white font-bold border border-red-700 transition flex items-center gap-1.5 cursor-pointer shadow-md animate-pulse';
          }
          if (micLabel) micLabel.innerText = '● Merekam Suara...';
        };

        recognition.onresult = function(event) {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          
          // Determine which step is active and stream speech into that field
          let targetInput = null;
          if (!document.getElementById('grillStep1').classList.contains('hidden')) {
            targetInput = document.getElementById('grillFullName');
          } else if (!document.getElementById('grillStep2').classList.contains('hidden')) {
            targetInput = document.getElementById('grillOrgName');
          } else if (!document.getElementById('grillStep3').classList.contains('hidden')) {
            targetInput = document.getElementById('grillTasksRaw');
          } else if (!document.getElementById('grillStep4').classList.contains('hidden')) {
            targetInput = document.getElementById('grillSkillsInput');
          }

          if (targetInput) {
            if (targetInput.value.trim().length > 0) {
              targetInput.value = targetInput.value.trim() + ' ' + transcript;
            } else {
              targetInput.value = transcript;
            }
            if (targetInput.id === 'grillTasksRaw') {
              handleGrillTaskInput(targetInput);
            } else {
              aiGrillHint(targetInput);
              syncGrillLivePreview();
            }
          }
        };

        recognition.onerror = function(err) {
          console.warn('Speech Recognition error:', err);
          isGrillVoiceRecording = false;
          if (micBtn) micBtn.className = 'shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs';
          if (micLabel) micLabel.innerText = 'Dikte Suara';
        };

        recognition.onend = function() {
          isGrillVoiceRecording = false;
          if (micBtn) micBtn.className = 'shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs';
          if (micLabel) micLabel.innerText = 'Dikte Suara';
        };

        grillSpeechRecognitionInstance = recognition;
        recognition.start();
      } catch (e) {
        console.error('Cannot start SpeechRecognition:', e);
      }
    }
`;

  // Sisipkan grillEngineJs tepat sebelum compileGrillMeToHarvardCv
  if (!html.includes('GRILL-ME 2.0 ENGINE: MULTI-EXPERIENCE')) {
    html = html.replace('function compileGrillMeToHarvardCv() {', grillEngineJs + '\n    function compileGrillMeToHarvardCv() {');
    console.log(`Injected Grill-Me 2.0 Engine JS into ${path.basename(filePath)}`);
  }

  // Update compileGrillMeToHarvardCv to support candidateAdditionalExperiences as well
  const oldCompileExp = `        <div class="section-heading">Pengalaman Magang & Organisasi (Professional Experience)</div>
        <div class="item-header">
          <span>\${orgName}</span>
          <span>\${orgPeriod.split('|')[0] || 'Indonesia'}</span>
        </div>
        <div class="item-sub">
          <span>\${orgRole}</span>
          <span>\${orgPeriod.split('|')[1] || '2024'}</span>
        </div>
        <ul>
          \${starBullet1 ? '<li>' + starBullet1 + '</li>' : ''}
          \${starBullet2 ? '<li>' + starBullet2 + '</li>' : ''}
        </ul>`;

  const newCompileExp = `        <div class="section-heading">Pengalaman Kerja & Organisasi (Professional Experience)</div>
        \${candidateAdditionalExperiences.map(exp => \`
          <div class="item-header">
            <span>\${exp.orgName}</span>
            <span>\${exp.orgPeriod.split('|')[0] || 'Indonesia'}</span>
          </div>
          <div class="item-sub">
            <span>\${exp.orgRole}</span>
            <span>\${exp.orgPeriod.split('|')[1] || '2024'}</span>
          </div>
          <ul>
            <li>\${exp.tasks}</li>
          </ul>
        \`).join('')}
        \${orgName ? \`
        <div class="item-header">
          <span>\${orgName}</span>
          <span>\${orgPeriod.split('|')[0] || 'Indonesia'}</span>
        </div>
        <div class="item-sub">
          <span>\${orgRole}</span>
          <span>\${orgPeriod.split('|')[1] || '2024'}</span>
        </div>
        <ul>
          \${starBullet1 ? '<li>' + starBullet1 + '</li>' : ''}
          \${starBullet2 ? '<li>' + starBullet2 + '</li>' : ''}
        </ul>
        \` : ''}`;

  if (html.includes(oldCompileExp)) {
    html = html.replace(oldCompileExp, newCompileExp);
    console.log(`Updated compileGrillMeToHarvardCv with multi-experience in ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
});

console.log('Grill-Me 2.0 upgrade script completed successfully!');
