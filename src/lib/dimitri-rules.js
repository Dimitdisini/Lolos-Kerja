/**
 * src/lib/dimitri-rules.js
 * 
 * 7 ATURAN MAIN SCRAPING & COLD EMAIL (DIMITRI HQ)
 * Engine Standar Emas Pengiriman Lamaran & Kurasi Loker
 * 
 * 1. Freshness: Khusus bulan berjalan & <= 30 hari
 * 2. Geo: Indonesia Only (Remote / Hybrid / Onsite)
 * 3. Anti-Duplikasi: 30-day cooldown per Company + Title
 * 4. Zero Bounce: Blacklist info@/noreply@, Whitelist hr@/talent@/career@
 * 5. Optimal Recruiter Timing: Selasa-Kamis, 08.30-10.30 WIB
 * 6. Daily Cap: Maksimal 30-40 email per hari
 * 7. Kepatuhan Subjek & Format: Kode loker khusus atau format pilar dinamis
 */

export const RECRUITER_EMAIL_BLACKLIST = [
  'info@', 'support@', 'help@', 'billing@', 'privacy@', 'admin@',
  'marketing@', 'sales@', 'contact@', 'office@', 'service@', 'cs@',
  'noreply@', 'no-reply@', 'donotreply@'
];

export const RECRUITER_EMAIL_WHITELIST = [
  'recruitment@', 'recruiting@', 'hr@', 'hrd@', 'career@', 'careers@',
  'talent@', 'people@', 'jobs@', 'hiring@', 'karir@'
];

export const FREE_PUBLIC_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.id', 'yahoo.co.uk',
  'ymail.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'mail.com', 'proton.me', 'protonmail.com', 'zoho.com', 'aol.com'
];

export const DIMITRI_HQ_RULES = {
  // ATURAN 1: Freshness & Bulan Berjalan
  isFreshAndCurrentMonth(postedDate) {
    if (!postedDate) return { valid: false, reason: 'Tanggal posting tidak ditemukan' };
    const date = new Date(postedDate);
    if (isNaN(date.getTime())) return { valid: false, reason: 'Format tanggal posting tidak valid' };

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return { valid: false, reason: 'Tanggal posting di masa depan' };

    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      return { valid: false, reason: `Lowongan kedaluwarsa (${Math.floor(diffDays)} hari lalu, batas 30 hari)` };
    }

    // Pastikan berada di bulan berjalan yang sama
    const isSameMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (!isSameMonth) {
      return { valid: false, reason: 'Lowongan berada di luar bulan berjalan' };
    }

    return { valid: true, diffDays: Math.floor(diffDays) };
  },

  // ATURAN 2: Filter Geografis (Indonesia Only)
  isIndonesiaLocation(locationStr) {
    const loc = (locationStr || '').toLowerCase().trim();
    if (!loc) return { valid: false, reason: 'Lokasi tidak spesifik' };

    const ID_REGEX = /indonesia|jakarta|jawa|bandung|surabaya|yogyakarta|jogja|bali|medan|semarang|tangerang|bekasi|bogor|depok|malang|solo|batam|remote/i;
    const FOREIGN_REGEX = /\b(singapore|malaysia|usa|united states|uk|united kingdom|india|australia|germany|vietnam|philippines)\b/i;

    if (FOREIGN_REGEX.test(loc) && !loc.includes('indonesia')) {
      return { valid: false, reason: `Lokasi luar negeri terdeteksi: '${loc}'` };
    }

    if (!ID_REGEX.test(loc)) {
      return { valid: false, reason: `Lokasi bukan wilayah Indonesia: '${loc}'` };
    }

    return { valid: true, location: loc };
  },

  // ATURAN 3: Anti-Duplikasi Riwayat (30-Day Cooldown)
  check30DayCooldown(appliedHistory, company, title) {
    if (!Array.isArray(appliedHistory) || appliedHistory.length === 0) {
      return { allowed: true, reason: 'Belum ada riwayat lamaran' };
    }

    const normComp = (company || '').toLowerCase().trim().replace(/^pt\s+|\scv\s+/g, '');
    const normTitle = (title || '').toLowerCase().trim();
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const matched = appliedHistory.find(item => {
      const itemComp = (item.company || '').toLowerCase().trim().replace(/^pt\s+|\scv\s+/g, '');
      const itemTitle = (item.role || item.title || '').toLowerCase().trim();
      const isSameTarget = itemComp === normComp && itemTitle === normTitle;

      if (!isSameTarget) return false;

      const sentTime = item.appliedAt ? new Date(item.appliedAt).getTime() : (item.timestamp || 0);
      const diff = now - sentTime;
      return diff < THIRTY_DAYS_MS;
    });

    if (matched) {
      const sentTime = matched.appliedAt ? new Date(matched.appliedAt).getTime() : (matched.timestamp || 0);
      const daysAgo = Math.floor((now - sentTime) / (1000 * 60 * 60 * 24));
      return {
        allowed: false,
        daysAgo,
        cooldownRemainingDays: 30 - daysAgo,
        reason: `Sudah pernah di-blast ${daysAgo} hari lalu. Cooldown aktif (${30 - daysAgo} hari tersisa).`
      };
    }

    return { allowed: true, reason: 'Aman untuk dilamar (lolos cooldown 30 hari)' };
  },

  // ATURAN 4: Filter Kualitas Email HRD (Zero Bounce Policy)
  validateHrdEmailQuality(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, reason: 'Alamat email kosong' };
    }

    const trimmed = email.toLowerCase().trim();
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(trimmed)) {
      return { valid: false, reason: 'Format email tidak valid' };
    }

    // 1. Blacklist prefix
    for (const prefix of RECRUITER_EMAIL_BLACKLIST) {
      if (trimmed.startsWith(prefix)) {
        return { valid: false, isBlacklisted: true, reason: `Email non-rekruter terdeteksi (${prefix}): rawan bounce / diabaikan.` };
      }
    }

    // 2. Reject public free domain for corporate scraping
    const domain = trimmed.split('@')[1];
    if (FREE_PUBLIC_DOMAINS.includes(domain)) {
      return { valid: false, isFreeDomain: true, reason: `Email menggunakan domain gratisan (${domain}), wajib email domain korporat.` };
    }

    // 3. Check Whitelist prefix
    const isWhitelisted = RECRUITER_EMAIL_WHITELIST.some(prefix => trimmed.startsWith(prefix));

    return {
      valid: true,
      isWhitelisted,
      email: trimmed,
      reason: isWhitelisted ? 'Email terverifikasi tim rekrutmen sah' : 'Email korporat valid'
    };
  },

  // ATURAN 5: Optimal Recruiter Timing (Waktu Emas HRD)
  getOptimalRecruiterTimingStatus(customDate = null) {
    const targetDate = customDate ? new Date(customDate) : new Date();

    // Konversi ke Waktu Indonesia Barat (WIB = UTC+7)
    const utcMs = targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000);
    const wibDate = new Date(utcMs + (7 * 3600000));

    const day = wibDate.getDay(); // 0: Minggu, 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu
    const hours = wibDate.getHours();
    const minutes = wibDate.getMinutes();
    const currentTimeInMin = (hours * 60) + minutes;

    const GOLDEN_START = (8 * 60) + 30; // 08:30 WIB
    const GOLDEN_END = (10 * 60) + 30;   // 10:30 WIB

    // 1. Weekend Auto-Freeze
    if (day === 0 || day === 6) {
      return {
        isOptimal: false,
        isFrozen: true,
        reason: 'Auto-Freeze Akhir Pekan (Sabtu/Minggu). Open rate drop drastis di bawah 15%.',
        recommendation: 'Jadwalkan pengiriman pada hari Selasa pukul 08:30 WIB.'
      };
    }

    // 2. Jumat Sore Auto-Freeze (> 15:00 WIB)
    if (day === 5 && currentTimeInMin >= (15 * 60)) {
      return {
        isOptimal: false,
        isFrozen: true,
        reason: 'Auto-Freeze Jumat Sore (> 15:00 WIB). Inbox akan tertimbun email akhir pekan.',
        recommendation: 'Jadwalkan pengiriman pada hari Selasa pukul 08:30 WIB.'
      };
    }

    // 3. Hari Emas: Selasa (2), Rabu (3), Kamis (4)
    const isGoldenDay = (day === 2 || day === 3 || day === 4);
    const isGoldenHour = (currentTimeInMin >= GOLDEN_START && currentTimeInMin <= GOLDEN_END);

    if (isGoldenDay && isGoldenHour) {
      return {
        isOptimal: true,
        isFrozen: false,
        reason: 'WAKTU EMAS HRD AKTIF (Selasa-Kamis, 08:30-10:30 WIB). Open rate tertinggi!',
        recommendation: 'Saat terbaik untuk mengirimkan lamaran sekarang.'
      };
    }

    return {
      isOptimal: false,
      isFrozen: false,
      reason: `Di luar jendela emas (${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} WIB).`,
      recommendation: 'Disarankan menunggu slot emas: Selasa-Kamis pukul 08:30 - 10:30 WIB.'
    };
  },

  // ATURAN 6: Batas Maksimal Harian (Daily Cap 30-40 Email)
  checkDailyBlastQuota(sentCountToday, maxCap = 35) {
    const count = parseInt(sentCountToday, 10) || 0;
    const remaining = Math.max(0, maxCap - count);

    if (count >= maxCap) {
      return {
        allowed: false,
        sentCountToday: count,
        remainingToday: 0,
        maxCap,
        reason: `Batas harian ${maxCap} email telah tercapai hari ini. Kuota di-reset besok pukul 00:00 WIB demi menjaga reputasi domain.`
      };
    }

    return {
      allowed: true,
      sentCountToday: count,
      remainingToday: remaining,
      maxCap,
      reason: `Sisa kuota aman hari ini: ${remaining} dari ${maxCap} email.`
    };
  },

  // ATURAN 7: Kepatuhan Format & Subjek Khusus
  generateSubjectLine(job, candidateName = 'Dimitri Ahmad', pillar = 'tech') {
    const rawDesc = `${job.description || ''} ${job.notes || ''}`;
    const title = (job.title || job.role || 'Posisi Target').trim();
    const company = (job.company || 'Perusahaan').trim();

    // Cek apakah ada instruksi subjek khusus di deskripsi loker (e.g., "Kirim email dengan subjek [BAP-JKT] - Nama")
    const subjectInstructionRegex = /(?:subjek|subject)[\s:]+(?:email[\s:]+)?(?:["'“‘]?)([\[A-Z0-9_\-\/]{3,20}(?:\s*-\s*|\s+)[^"'\n\r\.\,\<]+)(?:["'”’]?)/i;
    const match = rawDesc.match(subjectInstructionRegex);

    if (match && match[1]) {
      let customSubject = match[1].trim()
        .replace(/nama(?:\s+anda|\s+lengkap)?/gi, candidateName)
        .replace(/your\s+name/gi, candidateName);
      return {
        subject: customSubject,
        isCustomInstruction: true,
        reason: `Mematuhi format subjek wajib yang ditentukan oleh ${company}`
      };
    }

    // Format subjek dinamis pilar Dimitri HQ
    if (pillar === 'engineering' || pillar === 'delivery') {
      return {
        subject: `Lamaran: ${title} – ${candidateName} | Project Delivery & Engineering`,
        isCustomInstruction: false,
        reason: 'Format dinamis Pilar Delivery & Engineering Dimitri HQ'
      };
    }

    return {
      subject: `Lamaran: ${title} – ${candidateName} | AI & Data Workflow Specialist`,
      isCustomInstruction: false,
      reason: 'Format dinamis Pilar AI & Tech Specialist Dimitri HQ'
    };
  }
};

// Export individual functions
export const {
  isFreshAndCurrentMonth,
  isIndonesiaLocation,
  check30DayCooldown,
  validateHrdEmailQuality,
  getOptimalRecruiterTimingStatus,
  checkDailyBlastQuota,
  generateSubjectLine
} = DIMITRI_HQ_RULES;

export default DIMITRI_HQ_RULES;
