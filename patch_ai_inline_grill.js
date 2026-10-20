/**
 * patch_ai_inline_grill.js
 *
 * Dua perbaikan utama:
 * 1. Hapus semua konten preset/template hardcoded — panel SESUDAH, SEBELUM, dan
 *    field-field Grill-Me harus kosong bersih saat pertama dibuka.
 * 2. Pasang AI Inline Suggestion: setiap field Grill-Me (nama, kampus, organisasi,
 *    posisi, tugas) punya debounced oninput listener yang menghasilkan
 *    saran kontekstual real-time di tooltip/chip hint di bawah field tersebut —
 *    bukan template, melainkan berdasarkan apa yang sedang diketik pengguna.
 */

const fs   = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'Prototipe Karir Copilot.html'),
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Bersihkan teks awal panel SEBELUM & SESUDAH
  // ──────────────────────────────────────────────────────────────────────────

  // previewBefore → kosongkan teks default
  html = html.replace(
    /<p id="previewBefore" class="text-slate-600 italic">Menunggu input pengalaman\.\.\.<\/p>/,
    `<p id="previewBefore" class="text-slate-600 italic text-xs"></p>`
  );

  // previewAfter → kosongkan teks default
  html = html.replace(
    /<p id="previewAfter" class="text-slate-800 font-medium leading-relaxed">Formula STAR yang siap lolos ATS akan tampil di sini\.<\/p>/,
    `<p id="previewAfter" class="text-slate-800 font-medium leading-relaxed text-xs"></p>`
  );

  // runCVAnalysis empty branch — juga jangan isi teks default, biarkan kosong
  html = html.replace(
    `if (beforeEl) beforeEl.innerText = 'Menunggu input pengalaman...';
        const afterEl = document.getElementById('previewAfter');
        if (afterEl) afterEl.innerText = 'Formula STAR yang siap lolos ATS akan tampil di sini.';`,
    `if (beforeEl) beforeEl.innerText = '';
        const afterEl = document.getElementById('previewAfter');
        if (afterEl) afterEl.innerText = '';`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Hapus fallback template hardcoded di compileGrillMeToHarvardCv
  //    (nama/kampus/org/posisi/tugas default ← bukan data pengguna)
  // ──────────────────────────────────────────────────────────────────────────

  // Nama fallback
  html = html.replace(
    `|| ((currentUser && currentUser.name) ? currentUser.name : 'DIMAS PRATAMA, S.M.')`,
    `|| (currentUser?.name || '')`
  );

  // Phone fallback
  html = html.replace(
    `|| '+62 812-3456-7890'`,
    `|| ''`
  );

  // Campus fallback
  html = html.replace(
    `|| 'Universitas Indonesia – Fakultas Ekonomi & Bisnis'`,
    `|| ''`
  );

  // MajorGpa fallback
  html = html.replace(
    `|| 'Sarjana Manajemen (S.M.) – IPK 3.72 / 4.00, Cum Laude'`,
    `|| ''`
  );

  // OrgName fallback
  html = html.replace(
    `|| 'PT Telkom Indonesia (Persero) Tbk'`,
    `|| ''`
  );

  // OrgRole fallback
  html = html.replace(
    `|| 'Digital Project Coordinator Intern'`,
    `|| ''`
  );

  // OrgPeriod fallback
  html = html.replace(
    `|| 'Jakarta, Indonesia | Jan 2024 – Jun 2024'`,
    `|| ''`
  );

  // rawTasks fallback
  html = html.replace(
    `|| 'Memfasilitasi pengujian User Acceptance Testing (UAT) dan menyusun 25+ dokumen BRD terstruktur.'`,
    `|| ''`
  );

  // skills fallback
  html = html.replace(
    `const skillsStr = allSkillsArray.length ? allSkillsArray.join(', ') : 'Microsoft Excel (Advanced), Google Workspace, BPMN, SQL, Figma, Trello, Notion';`,
    `const skillsStr = allSkillsArray.join(', ');`
  );

  // starBullet2 hardcoded
  html = html.replace(
    `let starBullet2 = 'Memimpin pengujian dan dokumentasi proses kerja terstruktur bersama 8+ anggota tim dengan tingkat akurasi pencapaian 98%.';`,
    `let starBullet2 = '';`
  );

  // starBullet1 hardcoded (ketika rawTasks pendek)
  html = html.replace(
    `let starBullet1 = 'Menginisiasi koordinasi alur kerja lintas fungsi di ' + orgName + ' yang memangkas waktu approval tugas operasional sebesar 28%.';`,
    `let starBullet1 = '';`
  );

  // Hapus template PDF upload yang hardcoded
  html = html.replace(
    `textarea.value = \`• Menginisiasi dan mengelola proyek berbasis \${file.name.replace(/\\.[^/.]+$/, "")} bersama tim lintas fungsi yang meningkatkan efisiensi tugas sebesar 28%.\\n• Menyusun dokumentasi terstruktur dan pelaporan berkala yang memangkas durasi koordinasi mingguan.\\n• Menganalisis kebutuhan operasional dan mengimplementasikan solusi yang berdampak positif pada pencapaian target.\`;`,
    `// Berkas PDF/Word tidak dapat dibaca langsung di browser tanpa library parsing.
            // Biarkan textarea tetap kosong agar pengguna mengisi sendiri atau AI Inline Suggestion aktif.
            textarea.value = '';`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Pasang AI Inline Suggestion — logic debounce di setiap field Grill-Me
  // ──────────────────────────────────────────────────────────────────────────

  // Tambahkan oninput ke field-field Grill-Me via atribut HTML
  const grillInputs = [
    { id: 'grillFullName',   hint: 'grillHintFullName',   nextStep: null },
    { id: 'grillPhone',      hint: 'grillHintPhone',      nextStep: null },
    { id: 'grillCampus',     hint: 'grillHintCampus',     nextStep: null },
    { id: 'grillMajorGpa',   hint: 'grillHintMajorGpa',   nextStep: null },
    { id: 'grillOrgName',    hint: 'grillHintOrgName',    nextStep: null },
    { id: 'grillOrgRole',    hint: 'grillHintOrgRole',    nextStep: null },
    { id: 'grillOrgPeriod',  hint: 'grillHintOrgPeriod',  nextStep: null },
    { id: 'grillTasksRaw',   hint: 'grillHintTasksRaw',   nextStep: null },
  ];

  grillInputs.forEach(({ id, hint }) => {
    // Sisipkan hint placeholder setelah setiap input/textarea di Grill-Me
    // dan tambahkan oninput="aiGrillHint(this)" ke elemen
    const inputRegex = new RegExp(
      `(id="${id}"[^>]*>)`,
      'g'
    );
    html = html.replace(inputRegex, (match) => {
      const withEvent = match.replace('>', ` oninput="aiGrillHint(this)">`);
      return withEvent;
    });
  });

  // Untuk textarea grillTasksRaw, ganti > dengan oninput="aiGrillHint(this)">
  // (textarea tidak pakai />)
  html = html.replace(
    `id="grillTasksRaw" rows="4" class="dospem-input w-full p-3.5 rounded-xl text-xs leading-relaxed font-sans shadow-inner focus:ring-2 focus:ring-blue-500" placeholder=`,
    `id="grillTasksRaw" rows="4" oninput="aiGrillHint(this)" class="dospem-input w-full p-3.5 rounded-xl text-xs leading-relaxed font-sans shadow-inner focus:ring-2 focus:ring-blue-500" placeholder=`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Sisipkan hint container <div> setelah setiap input di Grill-Me Step 1-4
  //    dan script aiGrillHint()
  // ──────────────────────────────────────────────────────────────────────────

  // Sisipkan script AI inline suggestion sebelum </body>
  // Build the AI inline suggestion script as a plain string (no template literals to avoid Node syntax issues)
  const aiSuggestionScript = [
    '<!-- AI INLINE SUGGESTION ENGINE (Contextual, Zero Template) -->',
    '<script>',
    'const _grillHintTimers = {};',
    'function aiGrillHint(el) {',
    '  const id = el.id;',
    '  clearTimeout(_grillHintTimers[id]);',
    '  const val = el.value.trim();',
    '  const hintId = "hint_" + id;',
    '  let hintEl = document.getElementById(hintId);',
    '  if (!hintEl) {',
    '    hintEl = document.createElement("div");',
    '    hintEl.id = hintId;',
    '    hintEl.className = "mt-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 leading-relaxed transition-all duration-200 hidden";',
    '    el.parentNode.appendChild(hintEl);',
    '  }',
    '  if (!val || val.length < 3) { hintEl.classList.add("hidden"); hintEl.innerText = ""; return; }',
    '  _grillHintTimers[id] = setTimeout(function() {',
    '    const s = _grillSuggest(id, val);',
    '    if (s) { hintEl.innerHTML = s; hintEl.classList.remove("hidden"); }',
    '    else { hintEl.classList.add("hidden"); }',
    '  }, 350);',
    '}',
    'function _grillSuggest(f, val) {',
    '  const v = val.toLowerCase();',
    '  if (f === "grillFullName") {',
    '    if (!val.includes(",") && val.length > 4) {',
    '      const hasG = /s\\.?\\s*(e|t|m|kom|st|mn|si|pd|farm|ked|gz|h|sh|ab|sos|pi|i|hum|ip|psi|an|ap)/i.test(val);',
    '      if (!hasG) return "Tambahkan gelar di belakang nama. Misal: <em>" + val + ", S.T.</em> atau <em>" + val + ", S.M.</em>";',
    '    }',
    '    return "Format ATS: kapital per kata \\u2014 <strong>" + val.replace(/\\b\\w/g, function(c){return c.toUpperCase();}) + "</strong>";',
    '  }',
    '  if (f === "grillPhone") {',
    '    if (/^08/.test(val)) return "Standar internasional: <strong>+62" + val.slice(1) + "</strong>";',
    '    if (/^62/.test(val) && !val.startsWith("+")) return "Tambahkan tanda plus: <strong>+" + val + "</strong>";',
    '    if (val.replace(/[^0-9]/g, "").length >= 10) return "Nomor valid!";',
    '  }',
    '  if (f === "grillCampus") {',
    '    const map = {"ui":"Universitas Indonesia","ugm":"Universitas Gadjah Mada","itb":"Institut Teknologi Bandung","its":"Institut Teknologi Sepuluh Nopember","unpad":"Universitas Padjadjaran","undip":"Universitas Diponegoro","binus":"BINUS University","ub":"Universitas Brawijaya","unair":"Universitas Airlangga","telkom":"Universitas Telkom","tel u":"Universitas Telkom","uii":"Universitas Islam Indonesia","gunadarma":"Universitas Gunadarma","umm":"Universitas Muhammadiyah Malang"};',
    '    for (const k of Object.keys(map)) { if (v === k || v.startsWith(k)) return "Nama ATS lengkap: <strong>" + map[k] + "</strong>"; }',
    '    if (val.length >= 4 && !/universitas|institut|sekolah|akademi/i.test(val)) return "Tulis nama kampus lengkap, misal: Universitas " + val.replace(/\\b\\w/g,function(c){return c.toUpperCase();});',
    '  }',
    '  if (f === "grillMajorGpa") {',
    '    const m = val.match(/(\\d[.,]\\d+)/);',
    '    if (m) { const ipk = parseFloat(m[1].replace(",",".")); let lbl = ipk>=3.75?"(Cum Laude)":ipk>=3.5?"(Memuaskan)":ipk>=3.0?"(Cukup Baik)":"(Opsional dicantumkan)"; return "IPK " + ipk.toFixed(2) + " " + lbl; }',
    '    if (!/ipk|gpa/i.test(val) && val.length > 4) return "Tambahkan IPK. Misal: <em>" + val + " (IPK 3.72)</em>";',
    '  }',
    '  if (f === "grillOrgName") {',
    '    if (/\\bpt\\b|tbk|persero/i.test(val)) return "Perusahaan terdeteksi \\u2014 gunakan nama resmi lengkap.";',
    '    if (/\\bbem\\b|\\bhmj\\b|\\bhima\\b|ukm|osis/i.test(val)) return "Organisasi kampus \\u2014 pengalaman ini bernilai tinggi di CV fresh graduate!";',
    '    if (val.length >= 4) return "Pastikan nama resmi lengkap, bukan singkatan.";',
    '  }',
    '  if (f === "grillOrgRole") {',
    '    if (!/intern|officer|staff|coordinator|analyst|manager|head|lead|engineer|specialist|trainee|asisten|ketua|koordinator|sekretaris|bendahara/i.test(val))',
    '      return "Tambahkan level jabatan. Misal: <em>" + val + " Intern</em> atau <em>" + val + " Officer</em>";',
    '    return "Jabatan terdeteksi. Pastikan sesuai dengan surat kontrak/SK.";',
    '  }',
    '  if (f === "grillOrgPeriod") {',
    '    if (!val.includes("|")) return "Format ATS: <em>Kota | Bulan Tahun \\u2013 Bulan Tahun</em>. Contoh: <em>Jakarta | Jan 2024 \\u2013 Jun 2024</em>";',
    '    if (!/(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)/i.test(val)) return "Sertakan singkatan bulan, misal: Jan, Feb, Mar\\u2026";',
    '  }',
    '  if (f === "grillTasksRaw") {',
    '    const hasNum = /\\d+/.test(val);',
    '    const hasAct = /memimpin|mengkoordinasi|menyusun|membangun|mengelola|meningkatkan|mengembangkan|menganalisis|merancang|memfasilitasi/i.test(val);',
    '    const hasRes = /persen|%|efisiensi|berhasil|tercapai|lolos|naik|meningkat|lebih cepat|hasil/i.test(val);',
    '    const h = [];',
    '    if (!hasAct) h.push("\\u2022 Tambahkan <strong>kata kerja tindakan</strong> \\u2014 Memimpin, Menyusun, Mengembangkan...");',
    '    if (!hasNum) h.push("\\u2022 Tambahkan <strong>angka</strong> \\u2014 8 anggota, 25 dokumen, 3 bulan, 40%...");',
    '    if (!hasRes) h.push("\\u2022 Tambahkan <strong>hasil terukur</strong> \\u2014 ...sehingga efisiensi naik 30%, berhasil lolos UAT...");',
    '    if (h.length === 0) return "\\u2705 STAR terdeteksi! Ada tindakan, angka, dan hasil. Bagus!";',
    '    return h.join("<br>");',
    '  }',
    '  return null;',
    '}',
    '<\/script>',
  ].join('\n');

  // Sisipkan sebelum </body>
  if (!html.includes('AI INLINE SUGGESTION ENGINE')) {
    html = html.replace('</body>', aiSuggestionScript + '\n</body>');
    console.log(`Injected AI Inline Suggestion script into ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Patched ${path.basename(filePath)}`);
});

console.log('\nDone. AI inline suggestion + zero template content applied.');
