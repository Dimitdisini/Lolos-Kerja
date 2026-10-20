const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

[indexPath, protoPath].forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // Find cvModeGrillView container
  const grillRegex = /<!-- ============================================================= -->\s*<!-- TAMPILAN MODE GRILL-ME: TANYA JAWAB SANTAI[\s\S]*?<\/div>\s*<\/div>\s*<!-- ============================================================= -->\s*<!-- TAMPILAN MODE A: UNGGAH BERKAS PDF/;
  
  const newGrillView = `<!-- ============================================================= -->
            <!-- TAMPILAN MODE GRILL-ME: TYPEFORM / CHAT INTERAKTIF (1 PER 1 PERTANYAAN) -->
            <!-- ============================================================= -->
            <div id="cvModeGrillView" class="space-y-4">
              
              <!-- Progress Bar Typeform Interaktif -->
              <div class="space-y-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-3.5 rounded-2xl border border-blue-100/80 shadow-2xs">
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xs shadow-xs" id="grillStepBadge">1</span>
                    <span class="font-bold text-slate-900" id="grillStepTitle">Langkah 1 dari 4: Profil & Kampus</span>
                  </div>
                  <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-700 bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
                    <span id="grillStepIndicator">25%</span>
                  </div>
                </div>
                <div class="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                  <div id="grillProgressBar" class="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out" style="width: 25%"></div>
                </div>
              </div>

              <!-- ========================================================= -->
              <!-- CHAT BUBBLE KONTEN TYPEFORM (BERUBAH HALUS SETIAP LANGKAH) -->
              <!-- ========================================================= -->
              <div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 relative overflow-hidden">
                
                <!-- Chat Prompt Header -->
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 mt-0.5">
                    AI
                  </div>
                  <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-900">Career Copilot</span>
                      <span class="text-2xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">Panduan Interaktif</span>
                    </div>
                    <p id="grillChatBubbleText" class="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                      "Halo! Kita mulai dari biodata singkatmu dulu ya. Siapa nama lengkap dan asal kampusmu?"
                    </p>
                  </div>
                </div>

                <!-- STEP 1: PROFIL & KAMPUS -->
                <div id="grillStep1" class="space-y-3 transition-all duration-300 ease-in-out">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                      <input type="text" id="grillFullName" placeholder="misal: Dimas Pratama, S.M." onkeydown="handleGrillEnter(event, 2)" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">No. WhatsApp Aktif *</label>
                      <input type="text" id="grillPhone" placeholder="misal: +62 812-3456-7890" onkeydown="handleGrillEnter(event, 2)" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">Asal Kampus / Universitas *</label>
                      <input type="text" id="grillCampus" placeholder="misal: Universitas Indonesia" onkeydown="handleGrillEnter(event, 2)" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">Fakultas / Jurusan & IPK *</label>
                      <input type="text" id="grillMajorGpa" placeholder="misal: S1 Manajemen (IPK 3.72)" onkeydown="handleGrillEnter(event, 2)" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span class="text-2xs text-slate-400 hidden sm:inline">Tips: Tekan <kbd class="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">Enter ↵</kbd> untuk lanjut</span>
                    <button type="button" onclick="nextGrillStep(2)" class="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                      <span>Lanjut: Pengalaman &rarr;</span>
                    </button>
                  </div>
                </div>

                <!-- STEP 2: PENGALAMAN MAGANG / ORGANISASI -->
                <div id="grillStep2" class="hidden space-y-3 transition-all duration-300 ease-in-out">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Organisasi *</label>
                      <input type="text" id="grillOrgName" placeholder="misal: PT Telkom Indonesia / BEM Fakultas" onkeydown="handleGrillEnter(event, 3)" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-700 mb-1">Jabatan / Posisi Kamu *</label>
                      <input type="text" id="grillOrgRole" placeholder="misal: Project Management Intern / Staf Divisi" onkeydown="handleGrillEnter(event, 3)" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="sm:col-span-2">
                      <label class="block font-semibold text-slate-700 mb-1">Kota & Periode Kegiatan</label>
                      <input type="text" id="grillOrgPeriod" placeholder="misal: Jakarta | Jan 2024 – Jun 2024" onkeydown="handleGrillEnter(event, 3)" class="dospem-input w-full p-2.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                    </div>
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

                <!-- STEP 3: PENGGALI STAR & CAPAIAN ANGKA -->
                <div id="grillStep3" class="hidden space-y-3 transition-all duration-300 ease-in-out">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-2xs text-slate-500">
                      <span>Ceritakan dengan bahasamu sendiri (santai saja):</span>
                      <span class="text-blue-600 font-semibold">AI otomatis poles ke Google STAR</span>
                    </div>
                    <textarea id="grillTasksRaw" rows="4" class="dospem-input w-full p-3.5 rounded-xl text-xs leading-relaxed font-sans shadow-inner focus:ring-2 focus:ring-blue-500" placeholder="misal: Saya bantu tim koordinasi 8 orang bikin laporan mingguan, uji coba aplikasi ke 40 user, sama bantu efisiensi approval dokumen jadi lebih cepat..."></textarea>
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
                    <input type="text" id="grillSkillsInput" placeholder="misal: Public Speaking, Copywriting, React, SAP..." onkeydown="handleGrillEnter(event, 5)" class="dospem-input w-full p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500">
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

  if (grillRegex.test(html)) {
    html = html.replace(grillRegex, newGrillView);
    console.log(`Replaced cvModeGrillView in ${path.basename(filePath)}`);
  } else {
    console.warn(`GrillRegex did not match in ${path.basename(filePath)}`);
  }

  // Next, update nextGrillStep to update the conversational chat bubble and step badge smoothly
  const oldNextGrillJs = `    function nextGrillStep(stepNum) {
      [1, 2, 3, 4].forEach(s => {
        const el = document.getElementById('grillStep' + s);
        if (el) el.classList.add('hidden');
      });
      const activeStep = document.getElementById('grillStep' + stepNum);
      if (activeStep) activeStep.classList.remove('hidden');

      const titles = {
        1: 'Langkah 1 dari 4: Profil & Kampus',
        2: 'Langkah 2 dari 4: Pengalaman Magang / Organisasi',
        3: 'Langkah 3 dari 4: Ceritakan Tugas & Capaian (STAR)',
        4: 'Langkah 4 dari 4: Keahlian Teknis & Tools'
      };
      const titleEl = document.getElementById('grillStepTitle');
      if (titleEl) titleEl.innerText = titles[stepNum] || '';

      const percent = stepNum * 25;
      const bar = document.getElementById('grillProgressBar');
      if (bar) bar.style.width = percent + '%';
      const ind = document.getElementById('grillStepIndicator');
      if (ind) ind.innerText = percent + '%';
    }`;

  const newNextGrillJs = `    function appendGrillTaskSnippet(text) {
      const ta = document.getElementById('grillTasksRaw');
      if (!ta) return;
      if (ta.value.trim().length > 0) {
        ta.value = ta.value.trim() + '. ' + text;
      } else {
        ta.value = text;
      }
      ta.focus();
    }

    function handleGrillEnter(e, nextStep) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (nextStep === 5) {
          compileGrillMeToHarvardCv();
        } else {
          nextGrillStep(nextStep);
        }
      }
    }

    function nextGrillStep(stepNum) {
      [1, 2, 3, 4].forEach(s => {
        const el = document.getElementById('grillStep' + s);
        if (el) el.classList.add('hidden');
      });
      const activeStep = document.getElementById('grillStep' + stepNum);
      if (activeStep) activeStep.classList.remove('hidden');

      const titles = {
        1: 'Langkah 1 dari 4: Profil & Kampus',
        2: 'Langkah 2 dari 4: Pengalaman Magang / Organisasi',
        3: 'Langkah 3 dari 4: Ceritakan Tugas & Capaian (STAR)',
        4: 'Langkah 4 dari 4: Keahlian Teknis & Tools'
      };
      const chatPrompts = {
        1: '"Halo! Kita mulai dari biodata singkatmu dulu ya. Siapa nama lengkap dan asal kampusmu?"',
        2: '"Keren banget! Pernah ada pengalaman magang, kepanitiaan, atau organisasi kampus sebelumnya?"',
        3: '"Di posisi itu, apa saja yang kamu kerjakan sehari-hari? Ceritakan santai dengan bahasamu sendiri ya!"',
        4: '"Hampir selesai! Tools, software, atau kompetensi teknis apa yang biasa kamu pakai sehari-hari?"'
      };

      const titleEl = document.getElementById('grillStepTitle');
      if (titleEl) titleEl.innerText = titles[stepNum] || '';

      const badgeEl = document.getElementById('grillStepBadge');
      if (badgeEl) badgeEl.innerText = stepNum;

      const bubbleEl = document.getElementById('grillChatBubbleText');
      if (bubbleEl) {
        bubbleEl.innerText = chatPrompts[stepNum] || '';
      }

      const percent = stepNum * 25;
      const bar = document.getElementById('grillProgressBar');
      if (bar) bar.style.width = percent + '%';
      const ind = document.getElementById('grillStepIndicator');
      if (ind) ind.innerText = percent + '%';
    }`;

  if (html.includes(oldNextGrillJs)) {
    html = html.replace(oldNextGrillJs, newNextGrillJs);
    console.log(`Replaced nextGrillStep logic in ${path.basename(filePath)}`);
  } else {
    console.warn(`oldNextGrillJs not matched in ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
});

console.log('Typeform chat flow upgrade complete!');
