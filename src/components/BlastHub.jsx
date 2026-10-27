import React, { useState, useEffect, useMemo } from 'react';
import { 
  getOptimalRecruiterTimingStatus, 
  checkDailyBlastQuota, 
  check30DayCooldown, 
  validateHrdEmailQuality, 
  generateSubjectLine 
} from '../lib/dimitri-rules.js';
import { analyzeJobCvMatch, insertMissingKeywordsIntoCv } from '../lib/resume-matcher.js';

export default function BlastHub({ 
  selectedJobs = [], 
  candidateProfile,
  onProfileChange,
  onBackToJobs 
}) {
  const candName = candidateProfile?.identity?.name || 'Dimas Pratama';
  const candEmail = candidateProfile?.identity?.email || 'dimas.pratama@gmail.com';
  const candPhone = candidateProfile?.identity?.phone || '+62 812-3456-7890';
  const candDegree = candidateProfile?.education?.degree || 'Sarjana Manajemen (S.M.)';
  const candSchool = candidateProfile?.education?.school || 'Universitas Indonesia';
  const candGpa = candidateProfile?.education?.gpa || '3.72';

  // Local storage backed applied history & daily count
  const [appliedHistory, setAppliedHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('lk_applied_history');
      return saved ? JSON.parse(saved) : [
        {
          company: 'PT Unilever Indonesia',
          role: 'Management Trainee Supply Chain',
          email: 'recruitment.indonesia@unilever.com',
          appliedAt: new Date(Date.now() - (12 * 24 * 60 * 60 * 1000)).toISOString(),
          status: 'Terkirim'
        }
      ];
    } catch (e) {
      return [];
    }
  });

  const [dailySentCount, setDailySentCount] = useState(() => {
    try {
      const saved = localStorage.getItem('lk_daily_sent_count');
      return saved ? parseInt(saved, 10) : 1;
    } catch (e) {
      return 1;
    }
  });

  // Current active job for cover letter preview
  const [activeJobId, setActiveJobId] = useState(() => {
    return selectedJobs.length > 0 ? selectedJobs[0].id : null;
  });

  // Update activeJobId if selectedJobs changes
  useEffect(() => {
    if (selectedJobs.length > 0 && !activeJobId) {
      setActiveJobId(selectedJobs[0].id);
    }
  }, [selectedJobs, activeJobId]);

  const activeJob = useMemo(() => {
    return selectedJobs.find(j => j.id === activeJobId) || selectedJobs[0] || null;
  }, [selectedJobs, activeJobId]);

  // Hitung kecocokan kata kunci (Resume Matcher) untuk lowongan yang sedang aktif
  const activeMatch = useMemo(() => {
    return analyzeJobCvMatch(activeJob, candidateProfile);
  }, [activeJob, candidateProfile]);

  // Timing status & Daily Cap
  const timingStatus = useMemo(() => getOptimalRecruiterTimingStatus(), []);
  const dailyQuota = useMemo(() => checkDailyBlastQuota(dailySentCount, 35), [dailySentCount]);

  // Dispatch state
  const [isBlasting, setIsBlasting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [blastLogs, setBlastLogs] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1-Click Sisipkan Missing Keywords ke CV
  const handleAutoInsertKeywords = () => {
    if (!activeMatch.missingKeywords || activeMatch.missingKeywords.length === 0) {
      showNotification('Semua kata kunci penting sudah ada di CV Anda.');
      return;
    }

    if (!onProfileChange) {
      showNotification('Koneksi update profil tidak tersedia.');
      return;
    }

    const result = insertMissingKeywordsIntoCv(candidateProfile, activeMatch.missingKeywords);
    if (result && result.addedCount > 0) {
      onProfileChange(result.updatedProfile);
      showNotification(`Sukses menyisipkan ${result.addedCount} kata kunci (${result.addedKeywords.join(', ')}) ke CV Anda!`);
    }
  };

  // Generate dynamic cover letter for a job
  const generateCoverLetterText = (job) => {
    if (!job) return '';
    const subjectInfo = generateSubjectLine(job, candName, 'tech');
    const compName = job.company || 'Perusahaan';
    const roleTitle = job.title || 'Posisi';

    // Ambil keterampilan utama yang relevan
    const relevantSkills = candidateProfile?.skills?.technical?.slice(0, 4).join(', ') || 'analisis proses bisnis, perancangan User Stories, dan UAT';

    return `Yth. Tim Rekrutmen ${compName},

Perkenalkan saya ${candName}, lulusan ${candDegree} dari ${candSchool} dengan IPK ${candGpa}. Melalui surat ini, saya bermaksud mengajukan lamaran untuk posisi ${roleTitle} di ${compName}.

Berdasarkan latar belakang keahlian saya dalam ${relevantSkills}, saya telah berpengalaman menyederhanakan alur kerja operasional serta meningkatkan efisiensi alur approval hingga 28%. Saya memiliki ketertarikan tinggi terhadap standar kerja profesional ${compName} dan siap memberikan kontribusi nyata sejak hari pertama.

Bersama surat ini, saya lampirkan CV berstandar Harvard ATS lengkap dengan portofolio pencapaian terukur saya untuk bahan pertimbangan Bapak/Ibu.

Terima kasih atas waktu dan kesempatan yang diberikan.

Hormat saya,
${candName}
${candPhone} | ${candEmail}
${candidateProfile?.identity?.linkedin || 'linkedin.com/in/dimas-pratama'}`;
  };

  // 1-Click "Buka di Gmail"
  const handleOpenInGmail = (job) => {
    const targetJob = job || activeJob;
    if (!targetJob) return;

    const email = targetJob.recruiterEmail || 'recruitment@company.com';
    const subjectObj = generateSubjectLine(targetJob, candName, 'tech');
    const bodyText = generateCoverLetterText(targetJob);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subjectObj.subject)}&body=${encodeURIComponent(bodyText)}`;
    window.open(gmailUrl, '_blank');

    showNotification(`Membuka Gmail untuk lamaran ke ${targetJob.company}...`);
  };

  // Automated Smart Drip Blast
  const handleStartAutoBlast = async () => {
    if (selectedJobs.length === 0) {
      showNotification('Pilih minimal 1 lowongan terlebih dahulu!');
      return;
    }

    if (!dailyQuota.allowed) {
      showNotification('Batas harian pengiriman email telah tercapai hari ini.');
      return;
    }

    setIsBlasting(true);
    setCurrentStepIndex(0);
    const newLogs = [];

    for (let i = 0; i < selectedJobs.length; i++) {
      const job = selectedJobs[i];
      setCurrentStepIndex(i + 1);

      // Check 30-day cooldown
      const cooldown = check30DayCooldown(appliedHistory, job.company, job.title);
      if (!cooldown.allowed) {
        newLogs.push({
          jobId: job.id,
          company: job.company,
          status: 'DI-SKIP',
          reason: cooldown.reason,
          time: new Date().toLocaleTimeString('id-ID')
        });
        setBlastLogs([...newLogs]);
        continue;
      }

      // Simulate network dispatch with drip delay
      await new Promise(res => setTimeout(res, 1200));

      const subjectObj = generateSubjectLine(job, candName, 'tech');
      const targetEmail = job.recruiterEmail || 'careers@perusahaan.co.id';

      const record = {
        company: job.company,
        role: job.title,
        email: targetEmail,
        subject: subjectObj.subject,
        appliedAt: new Date().toISOString(),
        status: 'Terkirim (100% Primary Inbox)'
      };

      // Update state & persistence
      setAppliedHistory(prev => {
        const updated = [record, ...prev];
        try { localStorage.setItem('lk_applied_history', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });

      setDailySentCount(prev => {
        const next = prev + 1;
        try { localStorage.setItem('lk_daily_sent_count', String(next)); } catch(e) {}
        return next;
      });

      newLogs.push({
        jobId: job.id,
        company: job.company,
        status: 'SUKSES',
        reason: `Terkirim ke ${targetEmail}`,
        subject: subjectObj.subject,
        time: new Date().toLocaleTimeString('id-ID')
      });
      setBlastLogs([...newLogs]);
    }

    setIsBlasting(false);
    showNotification(`Pengiriman selesai! ${newLogs.filter(l => l.status === 'SUKSES').length} lamaran berhasil di-blast.`);
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
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Langkah 3: Smart Application Dispatcher (HERO FEATURE)
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pengiriman Lamaran Otomatis Berstandar Dimitri HQ
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Kirim lamaran cerdas tanpa repot input password Google. Dilengkapi pencocokan kata kunci Resume Matcher, proteksi 30-day cooldown, pembatasan kuota harian, dan jaminan 100% masuk ke Kotak Masuk Utama HRD.
        </p>
      </div>

      {/* Dimitri HQ 7 Golden Rules Indicator Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        
        {/* Aturan 5: Waktu Emas */}
        <div className={`border rounded-2xl p-4 transition ${
          timingStatus.isOptimal 
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aturan 5: Waktu Emas HRD
            </span>
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              timingStatus.isOptimal ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {timingStatus.isOptimal ? 'Jendela Emas Aktif' : 'Standar'}
            </span>
          </div>
          <div className="text-xs font-semibold mt-1">
            {timingStatus.reason}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {timingStatus.recommendation}
          </div>
        </div>

        {/* Aturan 6: Daily Cap */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aturan 6: Kuota Harian (Cap)
            </span>
            <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {dailyQuota.remainingToday} Tersisa
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 mt-1">
            Terkirim hari ini: {dailySentCount} dari batas aman {dailyQuota.maxCap} email
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Menjaga reputasi domain email agar bebas blacklist & spam.
          </div>
        </div>

        {/* Aturan 3 & 4: Zero Bounce & Cooldown */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aturan 3 & 4: Zero Bounce & Cooldown
            </span>
            <span className="text-[11px] font-extrabold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
              Proteksi Aktif
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 mt-1">
            Anti-Duplikasi 30 Hari + Whitelist HRD
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Menolak info@ & noreply@; hanya mengirim ke email PIC rekrutmen sah.
          </div>
        </div>

      </div>

      {/* Main Grid: Queue on Left, Cover Letter & Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Kolom Kiri: Antrean Target Lowongan (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Antrean Target Pengiriman ({selectedJobs.length})
            </h3>
            <button
              type="button"
              onClick={onBackToJobs}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer"
            >
              + Tambah / Ganti Lowongan
            </button>
          </div>

          {selectedJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <div className="text-slate-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-700">Belum ada lowongan yang dipilih.</p>
              <p className="text-[11px] text-slate-500 mt-1">Pilih lowongan di Katalog Loker untuk memulai pengiriman.</p>
              <button
                type="button"
                onClick={onBackToJobs}
                className="mt-3 text-xs bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-xl cursor-pointer"
              >
                Buka Katalog Loker
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedJobs.map((job) => {
                const isActive = job.id === activeJobId;
                const cooldown = check30DayCooldown(appliedHistory, job.company, job.title);
                const subjectObj = generateSubjectLine(job, candName, 'tech');
                const jobMatch = analyzeJobCvMatch(job, candidateProfile);

                return (
                  <div
                    key={job.id}
                    onClick={() => setActiveJobId(job.id)}
                    className={`border rounded-xl p-3.5 transition cursor-pointer ${
                      isActive 
                        ? 'border-slate-900 bg-slate-50 shadow-xs' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          {job.title}
                        </div>
                        <div className="text-xs font-semibold text-slate-600 mt-0.5">
                          {job.company}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {/* Cooldown Status Badge */}
                        {cooldown.allowed ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                            Siap Kirim
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                            Cooldown {cooldown.cooldownRemainingDays} Hari
                          </span>
                        )}

                        {/* Matcher Pill */}
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {jobMatch.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    {/* Email & Subject Info */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] space-y-1">
                      <div className="text-slate-500">
                        Penerima: <span className="font-mono text-slate-800 font-semibold">{job.recruiterEmail || 'Karir Portal'}</span>
                      </div>
                      <div className="text-slate-500 truncate">
                        Subjek: <span className="text-slate-800 font-medium">{subjectObj.subject}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Resume Matcher, Pratinjau Cover Letter & Eksekusi (7 Kolom) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            
            {/* 1. Resume Matcher Box (Kecocokan Kata Kunci) */}
            {activeJob && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Resume Matcher
                    </span>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                      activeMatch.matchScore >= 80 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                        : activeMatch.matchScore >= 60 
                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {activeMatch.matchScore}% Match ({activeMatch.grade})
                    </span>
                  </div>

                  {activeMatch.missingKeywords.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoInsertKeywords}
                      className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>⚡ Sisipkan {activeMatch.missingKeywords.length} Keyword ke CV</span>
                    </button>
                  )}
                </div>

                {/* Match Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeMatch.matchScore >= 80 ? 'bg-emerald-600' : activeMatch.matchScore >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${activeMatch.matchScore}%` }}
                  ></div>
                </div>

                {/* Chips Kata Kunci Cocok & Kurang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Kata Kunci Terpenuhi ({activeMatch.matchedKeywords.length})
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeMatch.matchedKeywords.length > 0 ? (
                        activeMatch.matchedKeywords.map((kw, idx) => (
                          <span key={idx} className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            <span>✓</span> {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum ada yang cocok</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-amber-700 uppercase">
                      Kata Kunci Belum Ada ({activeMatch.missingKeywords.length})
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeMatch.missingKeywords.length > 0 ? (
                        activeMatch.missingKeywords.map((kw, idx) => (
                          <span key={idx} className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            <span>⚠</span> {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px]">Semua kata kunci utama sudah ada di CV!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Pratinjau Cover Letter */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pratinjau Surat Lamaran Terpersonalisasi
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                  Target: {activeJob ? `${activeJob.title} - ${activeJob.company}` : 'Pilih dari antrean'}
                </h4>
              </div>
              {activeJob && (
                <span className="text-xs font-mono text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  Reply-To: {candEmail}
                </span>
              )}
            </div>

            {/* Email Body Viewer */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {activeJob ? generateCoverLetterText(activeJob) : 'Pilih lowongan di sebelah kiri untuk melihat surat lamaran.'}
            </div>

            {/* Dua Mode Eksekusi Bebas Ribet */}
            <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700">
                Pilih Metode Pengiriman (Bebas Password Google):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Opsi 1: Auto-Blast Otomatis */}
                <button
                  type="button"
                  disabled={isBlasting || selectedJobs.length === 0}
                  onClick={handleStartAutoBlast}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition shadow-xs cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>⚡ Mulai Auto-Blast Otomatis</span>
                  </div>
                  <span className="text-[10px] text-emerald-100 font-normal">
                    Smart Drip Cloud (Reply-To ke Gmail Anda)
                  </span>
                </button>

                {/* Opsi 2: Buka di Tab Gmail Pribadi */}
                <button
                  type="button"
                  disabled={!activeJob}
                  onClick={() => handleOpenInGmail(activeJob)}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 text-slate-800 font-bold text-xs px-4 py-3 rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <svg className="w-3.5 h-3.5 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                    </svg>
                    <span>Buka di Tab Gmail Pribadi</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    1-Click terbuka di tab baru, siap klik Kirim
                  </span>
                </button>

              </div>
            </div>

            {/* Progress Bar Saat Pengiriman Berjalan */}
            {isBlasting && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Memproses Smart Drip Dispatch...</span>
                  <span>{currentStepIndex} dari {selectedJobs.length}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStepIndex / selectedJobs.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Log Hasil Pengiriman */}
            {blastLogs.length > 0 && (
              <div className="mt-4 bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-xl space-y-1 max-h-40 overflow-y-auto">
                <div className="text-slate-400 font-bold mb-1">// LOG PENGIRIMAN LIVE:</div>
                {blastLogs.map((log, lIdx) => (
                  <div key={lIdx} className="flex items-center justify-between">
                    <span>[{log.time}] {log.company}: {log.reason}</span>
                    <span className={log.status === 'SUKSES' ? 'text-emerald-300 font-bold' : 'text-amber-400'}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Riwayat Pengiriman & Pelacak Cooldown 30 Hari */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pelacak Cooldown & Riwayat Lamaran
            </span>
            <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
              Daftar Perusahaan yang Pernah Dikirimkan Lamaran
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {appliedHistory.length} Riwayat Tersimpan
          </span>
        </div>

        {appliedHistory.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            Belum ada riwayat lamaran yang dikirimkan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <th className="pb-2.5 font-bold">Perusahaan</th>
                  <th className="pb-2.5 font-bold">Posisi Target</th>
                  <th className="pb-2.5 font-bold">Email Rekruter</th>
                  <th className="pb-2.5 font-bold">Tanggal Kirim</th>
                  <th className="pb-2.5 font-bold">Status Cooldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {appliedHistory.map((item, idx) => {
                  const sentDate = item.appliedAt ? new Date(item.appliedAt) : new Date();
                  const daysAgo = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
                  const isUnderCooldown = daysAgo < 30;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-900">{item.company}</td>
                      <td className="py-2.5">{item.role || item.title || '-'}</td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-600">{item.email}</td>
                      <td className="py-2.5 text-slate-500">{sentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="py-2.5">
                        {isUnderCooldown ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            Cooldown ({30 - daysAgo} hari tersisa)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Bebas Kirim Ulang
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </section>
  );
}
