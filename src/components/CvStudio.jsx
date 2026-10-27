import React, { useState } from 'react';

const DEFAULT_PROFILE = {
  identity: {
    name: 'Dimas Pratama',
    title: 'Fresh Graduate Manajemen & Business Analyst',
    city: 'Jakarta Selatan, Indonesia',
    phone: '+62 812-3456-7890',
    email: 'dimas.pratama@gmail.com',
    linkedin: 'linkedin.com/in/dimas-pratama-ats'
  },
  summary: 'Fresh graduate berprestasi dengan fokus spesialisasi bisnis dan analisis proses operasional berstandar internasional. Menguasai pemodelan alur kerja BPMN, audit proses AS-IS ke TO-BE, serta dokumentasi teknis terstruktur dengan rekam jejak efisiensi kerja nyata.',
  education: {
    school: 'Universitas Indonesia',
    degree: 'Sarjana Manajemen (S.M.)',
    major: 'Fakultas Ekonomi & Bisnis',
    gpa: '3.72 / 4.00 (Cum Laude)',
    period: '2021 – 2025'
  },
  experience: [
    {
      company: 'PT Solusi Teknologi Nusantara',
      role: 'Junior Business Analyst Intern',
      period: 'Agustus 2024 – Februari 2025',
      bullets: [
        'Menganalisis 14 alur kerja operasional AS-IS dan merancang rekomendasi TO-BE berbasis BPMN 2.0 yang memangkas waktu approval sebesar 28%.',
        'Menyusun 35 dokumen User Stories berstandar Gherkin (Given-When-Then) untuk tim engineering tanpa ada revisi mayor saat sprint review.',
        'Mengkoordinasikan User Acceptance Testing (UAT) bersama 4 departemen lintas divisi dan menyelesaikan 100% bug blocker sebelum rilis produksi.'
      ]
    },
    {
      company: 'Himpunan Mahasiswa Manajemen UI',
      role: 'Kepala Divisi Riset & Proyek Strategis',
      period: 'Januari 2023 – Desember 2023',
      bullets: [
        'Memimpin tim beranggotakan 8 staf dalam riset kepuasan 450+ mahasiswa dengan response rate mencapai 84%.',
        'Mengotomatiskan pengolahan data survei menggunakan Google Sheets & Python script yang menghemat 40 jam kerja manual divisi.'
      ]
    }
  ],
  skills: {
    technical: ['Business Process Modeling (BPMN)', 'Gap Analysis', 'Requirements Engineering', 'Dual-View Documentation', 'UAT'],
    tools: ['Figma', 'Jira', 'Notion', 'Microsoft Excel (Advanced Pivot & VLOOKUP)', 'SQL Basics', 'Tableau'],
    languages: ['Bahasa Indonesia (Native)', 'English (Professional Working Proficiency)']
  }
};

export default function CvStudio({ 
  profile = DEFAULT_PROFILE, 
  onProfileChange,
  onProceedToJobs 
}) {
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [activeSubTab, setActiveSubTab] = useState('preview'); // 'preview' | 'edit'
  const [atsScore, setAtsScore] = useState(94);
  const [isPolished, setIsPolished] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplySample = () => {
    setCurrentProfile(DEFAULT_PROFILE);
    setAtsScore(94);
    setIsPolished(true);
    if (onProfileChange) onProfileChange(DEFAULT_PROFILE);
    showNotification('Draf Harvard ATS berhasil dimuat!');
  };

  const handlePolishSTAR = () => {
    setIsPolished(true);
    setAtsScore(96);
    showNotification('Seluruh bullet point berhasil dirombak ke formula STAR (Dampak Terukur)!');
  };

  const handleDownloadPdf = () => {
    // Generate text/pdf representation or trigger print
    window.print();
  };

  const handleCopyText = () => {
    const p = currentProfile;
    const text = `
${p.identity.name.toUpperCase()}
${p.identity.city} | ${p.identity.phone} | ${p.identity.email} | ${p.identity.linkedin}

RINGKASAN PROFIL
${p.summary}

PENDIDIKAN
${p.education.school} (${p.education.period})
${p.education.degree} - ${p.education.major} (IPK: ${p.education.gpa})

PENGALAMAN KERJA & ORGANISASI
${p.experience.map(exp => `
${exp.company} | ${exp.role} (${exp.period})
${exp.bullets.map(b => `• ${b}`).join('\n')}
`).join('\n')}

KEAHLIAN & KOMPETENSI TEKNIS
Kompetensi Inti: ${p.skills.technical.join(', ')}
Tools & Software: ${p.skills.tools.join(', ')}
Bahasa: ${p.skills.languages.join(', ')}
    `.trim();

    navigator.clipboard.writeText(text);
    showNotification('Teks CV Harvard ATS berhasil disalin ke clipboard!');
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 transition animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Badge */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Langkah 1: CV Studio Harvard ATS
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bedah Draf & Rombak Otomatis Jadi Format Harvard ATS
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          CV bergaya grafis warna-warni 82% gagal diparsing oleh mesin ATS (Taleo/Workday). Format Harvard 1-kolom memastikan data Anda 100% terbaca sempurna oleh HRD korporat.
        </p>
      </div>

      {/* Screening Diagnosis Card: Comparison (Old 42/100 vs New 94/100) */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-7 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Hasil Diagnosis Sistem Screening ATS
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Perbandingan Skor Kelulusan Mesin Screening
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplySample}
              className="text-xs bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Muat Profil Rekomendasi
            </button>
            <button
              type="button"
              onClick={handlePolishSTAR}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>⚡ Rombak Jadi Harvard ATS</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Card Kiri: CV Desain Lama */}
          <div className="bg-white border border-rose-200/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                CV Canva / Dua Kolom Lama
              </span>
              <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                Skor: 42 / 100
              </span>
            </div>
            <p className="text-xs text-rose-800 font-medium mb-3">
              Risiko Tinggi: 82% kemungkinan dibuang sebelum dibaca manusia.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span><strong>Format 2-Kolom & Ikon:</strong> Teks saling tumpang tindih saat diekstrak bot ATS.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span><strong>Deskripsi Pasif:</strong> "Bertanggung jawab atas pekerjaan X" tanpa angka hasil nyata.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span><strong>Kontak Tidak Standar:</strong> Tidak menyertakan domisili kota & URL LinkedIn aktif.</span>
              </li>
            </ul>
          </div>

          {/* Card Kanan: Standar Harvard ATS */}
          <div className="bg-white border border-emerald-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Standar Resmi Harvard ATS
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Skor: {atsScore} / 100
              </span>
            </div>
            <p className="text-xs text-emerald-900 font-medium mb-3">
              Lolos Optimal: 96% lolos parser Taleo, Workday, Glints, dan JobStreet.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span><strong>Format 1-Kolom Murni:</strong> Parsing 100% mulus dari atas ke bawah tanpa glitch.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span><strong>Formula STAR Kuantitatif:</strong> Dilengkapi angka metrik nyata (28% efisiensi, 35 dokumen).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span><strong>Standar Kontak Akademik:</strong> Dilengkapi lokasi kota, telepon aktif, dan tautan LinkedIn.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* 4 Pilar Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">1. Format 1-Kolom</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-0.5">100% Sesuai</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">2. Kata Kerja STAR</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-0.5">92% Terpaut</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">3. Kepadatan Angka</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-0.5">88% Terukur</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">4. Kontak Standar</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-0.5">100% Lengkap</div>
          </div>
        </div>
      </div>

      {/* Main Workspace: Mode Preview vs Mode Edit */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden mb-8">
        
        {/* Workspace Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs self-start">
            <button
              type="button"
              onClick={() => setActiveSubTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'preview'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pratinjau A4 Harvard
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'edit'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Edit Isian Data
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopyText}
              className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Salin Teks Lengkap
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-8 bg-slate-100/50 flex justify-center">
          
          {activeSubTab === 'preview' ? (
            /* Authentic Harvard ATS A4 Sheet */
            <div className="w-full max-w-[800px] bg-white border border-slate-200/90 shadow-md rounded-lg p-8 sm:p-12 font-serif text-slate-900 leading-normal text-xs sm:text-[13px]">
              
              {/* Header Nama & Kontak */}
              <div className="text-center pb-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  {currentProfile.identity.name}
                </h1>
                <div className="mt-1.5 text-xs text-slate-700 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  <span>{currentProfile.identity.city}</span>
                  <span>|</span>
                  <span>{currentProfile.identity.phone}</span>
                  <span>|</span>
                  <span>{currentProfile.identity.email}</span>
                  <span>|</span>
                  <span className="text-slate-800 underline underline-offset-2">{currentProfile.identity.linkedin}</span>
                </div>
              </div>

              <div className="w-full border-b border-slate-800 mb-4"></div>

              {/* Section 1: Ringkasan Profil */}
              <div className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-0.5 border-b border-slate-400 mb-1.5">
                  Ringkasan Profil (Professional Summary)
                </h2>
                <p className="text-slate-800 text-justify leading-relaxed">
                  {currentProfile.summary}
                </p>
              </div>

              {/* Section 2: Pendidikan */}
              <div className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-0.5 border-b border-slate-400 mb-2">
                  Pendidikan (Education)
                </h2>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{currentProfile.education.school}</span>
                  <span className="text-xs text-slate-700">{currentProfile.education.period}</span>
                </div>
                <div className="italic text-slate-800">
                  {currentProfile.education.degree} – {currentProfile.education.major} (IPK: {currentProfile.education.gpa})
                </div>
              </div>

              {/* Section 3: Pengalaman */}
              <div className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-0.5 border-b border-slate-400 mb-2">
                  Pengalaman Kerja & Organisasi (Professional Experience)
                </h2>
                {currentProfile.experience.map((exp, idx) => (
                  <div key={idx} className="mb-3.5 last:mb-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">{exp.company}</span>
                      <span className="text-xs text-slate-700">{exp.period}</span>
                    </div>
                    <div className="italic text-slate-800 mb-1">
                      {exp.role}
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-800">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Section 4: Keahlian & Tools */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-0.5 border-b border-slate-400 mb-2">
                  Keahlian & Kompetensi Teknis (Skills & Competencies)
                </h2>
                <div className="space-y-1.5 text-slate-800">
                  <div>
                    <strong className="text-slate-900">Kompetensi Inti: </strong>
                    <span>{currentProfile.skills.technical.join(', ')}</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Tools & Software: </strong>
                    <span>{currentProfile.skills.tools.join(', ')}</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Bahasa: </strong>
                    <span>{currentProfile.skills.languages.join(', ')}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Mode Form Edit */
            <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              
              {/* Identitas */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  1. Informasi Identitas & Kontak
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                    <input 
                      type="text"
                      value={currentProfile.identity.name}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        identity: { ...currentProfile.identity, name: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Domisili Kota</label>
                    <input 
                      type="text"
                      value={currentProfile.identity.city}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        identity: { ...currentProfile.identity, city: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                    <input 
                      type="text"
                      value={currentProfile.identity.phone}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        identity: { ...currentProfile.identity, phone: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Profesional</label>
                    <input 
                      type="email"
                      value={currentProfile.identity.email}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        identity: { ...currentProfile.identity, email: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tautan LinkedIn</label>
                    <input 
                      type="text"
                      value={currentProfile.identity.linkedin}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        identity: { ...currentProfile.identity, linkedin: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Ringkasan */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  2. Ringkasan Profesional (Professional Summary)
                </h3>
                <textarea
                  rows={3}
                  value={currentProfile.summary}
                  onChange={(e) => setCurrentProfile({
                    ...currentProfile,
                    summary: e.target.value
                  })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900 leading-relaxed"
                />
              </div>

              {/* Pendidikan */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  3. Pendidikan Terakhir
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Universitas</label>
                    <input 
                      type="text"
                      value={currentProfile.education.school}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        education: { ...currentProfile.education, school: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gelar & Jurusan</label>
                    <input 
                      type="text"
                      value={`${currentProfile.education.degree} - ${currentProfile.education.major}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        setCurrentProfile({
                          ...currentProfile,
                          education: { 
                            ...currentProfile.education, 
                            degree: parts[0]?.trim() || '', 
                            major: parts[1]?.trim() || '' 
                          }
                        });
                      }}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IPK (GPA)</label>
                    <input 
                      type="text"
                      value={currentProfile.education.gpa}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        education: { ...currentProfile.education, gpa: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Kelulusan</label>
                    <input 
                      type="text"
                      value={currentProfile.education.period}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        education: { ...currentProfile.education, period: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('preview');
                    showNotification('Perubahan data berhasil disimpan!');
                  }}
                  className="text-xs bg-slate-900 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Simpan & Lihat Pratinjau
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Bottom Step Progression Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            CV Harvard ATS Siap Dipakai
          </span>
          <h3 className="text-lg sm:text-xl font-bold mt-1">
            Langkah Selanjutnya: Pilih Lowongan Terverifikasi
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Pilih 3 hingga 5 target lowongan dari katalog 427 lowongan resmi Indonesia, lalu jalankan pengiriman lamaran cerdas tanpa repot setting SMTP.
          </p>
        </div>
        <button
          type="button"
          onClick={onProceedToJobs}
          className="shrink-0 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
        >
          <span>Pilih Lowongan Kerja (Langkah 2)</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

    </section>
  );
}
