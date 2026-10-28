/**
 * src/lib/application-tracker.js
 * 
 * APPLICATION TRACKER & KANBAN ENGINE
 * Ekosistem Dimitri HQ - Lolos Kerja V2
 * 
 * Mengelola pipeline pemantauan status lamaran kerja:
 * 1. Terkirim (sent)
 * 2. Sedang Direview (reviewing)
 * 3. Jadwal Interview (interview)
 * 4. Offering / Diterima (offering)
 * 5. Belum Lolos (rejected)
 */

export const APPLICATION_STAGES = [
  {
    id: 'sent',
    label: 'Terkirim',
    description: 'Email lamaran berhasil terkirim ke Kotak Masuk HRD.',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500'
  },
  {
    id: 'reviewing',
    label: 'Sedang Direview',
    description: 'Profil Anda sedang disortir oleh rekruter / ATS.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500'
  },
  {
    id: 'interview',
    label: 'Jadwal Interview',
    description: 'Mendapat undangan interview HR, User, atau Technical test.',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500'
  },
  {
    id: 'offering',
    label: 'Offering / Diterima',
    description: 'Menerima surat penawaran kerja (Job Offer).',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600'
  },
  {
    id: 'rejected',
    label: 'Belum Lolos',
    description: 'Proses seleksi belum berhasil untuk posisi ini.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400'
  }
];

export const INITIAL_APPLICATIONS = [
  {
    id: 'app-init-1',
    company: 'PT Unilever Indonesia',
    role: 'Management Trainee Supply Chain',
    email: 'recruitment.indonesia@unilever.com',
    appliedAt: new Date(Date.now() - (12 * 24 * 60 * 60 * 1000)).toISOString(),
    status: 'interview',
    stage: 'interview',
    notes: 'Jadwal Initial HR Interview via Zoom pada hari Jumat jam 10.00 WIB.',
    interviewDate: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)).toISOString()
  },
  {
    id: 'app-init-2',
    company: 'PT Gocean Indonesia',
    role: 'Junior Business Analyst',
    email: 'recruitment@gocean.co.id',
    appliedAt: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString(),
    status: 'reviewing',
    stage: 'reviewing',
    notes: 'Lamaran dikirim via Smart Drip. CV Harvard ATS terlampir.'
  },
  {
    id: 'app-init-3',
    company: 'Trinova Tech Solutions',
    role: 'Prompt Engineer & AI Workflow Specialist',
    email: 'hello@trinovatechsolutions.com',
    appliedAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString(),
    status: 'sent',
    stage: 'sent',
    notes: 'Email dikirim via Gmail pribadi dengan cover letter modern.'
  }
];

/**
 * Normalisasi objek lamaran untuk memastikan ID, stage, dan timestamps lengkap
 * @param {object} item 
 * @returns {object}
 */
export function normalizeApplicationRecord(item) {
  if (!item) return null;
  const id = item.id || `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  // Mapping status lama jika berformat string
  let stage = item.stage || item.status || 'sent';
  if (stage.toLowerCase().includes('terkirim') || stage === 'sent') stage = 'sent';
  else if (stage.toLowerCase().includes('review') || stage === 'reviewing') stage = 'reviewing';
  else if (stage.toLowerCase().includes('interview') || stage === 'interview') stage = 'interview';
  else if (stage.toLowerCase().includes('offering') || stage.toLowerCase().includes('terima') || stage === 'offering') stage = 'offering';
  else if (stage.toLowerCase().includes('tolak') || stage.toLowerCase().includes('gagal') || stage === 'rejected') stage = 'rejected';
  else stage = 'sent';

  return {
    id,
    company: (item.company || 'Perusahaan').trim(),
    role: (item.role || item.title || 'Posisi').trim(),
    email: (item.email || '').trim(),
    appliedAt: item.appliedAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    stage,
    status: stage,
    notes: item.notes || '',
    interviewDate: item.interviewDate || null,
    salary: item.salary || null
  };
}

/**
 * Menghitung metrik performa pencarian kerja pelamar
 * @param {Array<object>} applications 
 * @returns {object}
 */
export function calculateTrackerMetrics(applications = []) {
  const list = Array.isArray(applications) ? applications.map(normalizeApplicationRecord).filter(Boolean) : [];
  const total = list.length;

  const countByStage = {
    sent: 0,
    reviewing: 0,
    interview: 0,
    offering: 0,
    rejected: 0
  };

  list.forEach(app => {
    if (countByStage[app.stage] !== undefined) {
      countByStage[app.stage]++;
    } else {
      countByStage.sent++;
    }
  });

  // Tingkat Respon Rekruter (reviewing + interview + offering + rejected) / total
  const respondedCount = countByStage.reviewing + countByStage.interview + countByStage.offering + countByStage.rejected;
  const responseRate = total > 0 ? Math.round((respondedCount / total) * 100) : 0;

  // Tingkat Interview (interview + offering) / total
  const interviewCount = countByStage.interview + countByStage.offering;
  const interviewRate = total > 0 ? Math.round((interviewCount / total) * 100) : 0;

  return {
    total,
    countByStage,
    responseRate,
    interviewRate,
    activeInterviews: countByStage.interview,
    activeOffers: countByStage.offering
  };
}

/**
 * Memindahkan status lamaran ke stage baru
 * @param {Array<object>} applications 
 * @param {string} appId 
 * @param {string} newStage 
 * @returns {Array<object>}
 */
export function updateApplicationStage(applications, appId, newStage) {
  if (!Array.isArray(applications)) return [];
  const validStages = APPLICATION_STAGES.map(s => s.id);
  if (!validStages.includes(newStage)) return applications;

  return applications.map(app => {
    if (String(app.id) === String(appId)) {
      return {
        ...app,
        stage: newStage,
        status: newStage,
        updatedAt: new Date().toISOString()
      };
    }
    return app;
  });
}

/**
 * Menambahkan catatan atau jadwal interview pada lamaran tertentu
 * @param {Array<object>} applications 
 * @param {string} appId 
 * @param {string} notes 
 * @param {string|null} interviewDate 
 * @returns {Array<object>}
 */
export function updateApplicationNotes(applications, appId, notes, interviewDate = null) {
  if (!Array.isArray(applications)) return [];

  return applications.map(app => {
    if (String(app.id) === String(appId)) {
      return {
        ...app,
        notes: notes !== undefined ? notes : app.notes,
        interviewDate: interviewDate !== undefined ? interviewDate : app.interviewDate,
        updatedAt: new Date().toISOString()
      };
    }
    return app;
  });
}

/**
 * Menambahkan lamaran baru ke daftar riwayat
 * @param {Array<object>} applications 
 * @param {object} newRecord 
 * @returns {Array<object>}
 */
export function addApplicationRecord(applications, newRecord) {
  const norm = normalizeApplicationRecord(newRecord);
  if (!norm) return applications;

  const current = Array.isArray(applications) ? applications : [];
  // Periksa apakah kombinasi ID atau company+role sudah ada
  const exists = current.some(a => 
    String(a.id) === String(norm.id) || 
    (a.company.toLowerCase() === norm.company.toLowerCase() && a.role.toLowerCase() === norm.role.toLowerCase())
  );

  if (exists) {
    // Update existing record
    return current.map(a => {
      if (a.company.toLowerCase() === norm.company.toLowerCase() && a.role.toLowerCase() === norm.role.toLowerCase()) {
        return { ...a, ...norm, updatedAt: new Date().toISOString() };
      }
      return a;
    });
  }

  return [norm, ...current];
}

/**
 * Menghapus lamaran dari daftar riwayat
 * @param {Array<object>} applications 
 * @param {string} appId 
 * @returns {Array<object>}
 */
export function deleteApplicationRecord(applications, appId) {
  if (!Array.isArray(applications)) return [];
  return applications.filter(a => String(a.id) !== String(appId));
}

/**
 * Ekspor data lamaran ke format CSV sederhana untuk diunduh pengguna
 * @param {Array<object>} applications 
 * @returns {string} Konten file CSV
 */
export function exportApplicationsToCsv(applications) {
  const list = Array.isArray(applications) ? applications.map(normalizeApplicationRecord) : [];
  const headers = ['ID', 'Perusahaan', 'Posisi', 'Email Rekruter', 'Tahap / Status', 'Tanggal Kirim', 'Catatan'];

  const rows = list.map(app => {
    const stageObj = APPLICATION_STAGES.find(s => s.id === app.stage);
    const stageLabel = stageObj ? stageObj.label : app.stage;
    const dateStr = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('id-ID') : '-';
    const safeCompany = `"${(app.company || '').replace(/"/g, '""')}"`;
    const safeRole = `"${(app.role || '').replace(/"/g, '""')}"`;
    const safeEmail = `"${(app.email || '').replace(/"/g, '""')}"`;
    const safeNotes = `"${(app.notes || '').replace(/"/g, '""')}"`;

    return [app.id, safeCompany, safeRole, safeEmail, stageLabel, dateStr, safeNotes].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
