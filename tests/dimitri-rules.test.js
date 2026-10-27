import { describe, it, expect } from 'vitest';
import {
  isFreshAndCurrentMonth,
  isIndonesiaLocation,
  check30DayCooldown,
  validateHrdEmailQuality,
  getOptimalRecruiterTimingStatus,
  checkDailyBlastQuota,
  generateSubjectLine
} from '../src/lib/dimitri-rules.js';

describe('Dimitri HQ - 7 Aturan Main Scraping & Cold Email Engine', () => {

  // ATURAN 1: Freshness & Bulan Berjalan
  describe('Aturan 1: Freshness & Bulan Berjalan', () => {
    it('menerima lowongan yang baru diposting dalam bulan berjalan', () => {
      const today = new Date();
      const res = isFreshAndCurrentMonth(today.toISOString());
      expect(res.valid).toBe(true);
    });

    it('menolak lowongan yang diposting lebih dari 30 hari lalu', () => {
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
      const res = isFreshAndCurrentMonth(oldDate.toISOString());
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('30 hari');
    });
  });

  // ATURAN 2: Filter Geografis (Indonesia Only)
  describe('Aturan 2: Filter Geografis (Indonesia Only)', () => {
    it('menerima lowongan di kota-kota Indonesia dan remote', () => {
      expect(isIndonesiaLocation('Jakarta Selatan, Indonesia').valid).toBe(true);
      expect(isIndonesiaLocation('Bandung, Jawa Barat').valid).toBe(true);
      expect(isIndonesiaLocation('Indonesia (Remote)').valid).toBe(true);
    });

    it('menolak lowongan di luar negeri', () => {
      expect(isIndonesiaLocation('Singapore, Central').valid).toBe(false);
      expect(isIndonesiaLocation('Kuala Lumpur, Malaysia').valid).toBe(false);
      expect(isIndonesiaLocation('California, United States').valid).toBe(false);
    });
  });

  // ATURAN 3: 30-Day Cooldown (Anti-Duplikasi Perusahaan + Posisi)
  describe('Aturan 3: 30-Day Cooldown', () => {
    const mockHistory = [
      {
        company: 'PT Gocean Indonesia',
        role: 'Junior Business Analyst',
        appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 hari lalu
      }
    ];

    it('memblokir pengiriman ulang ke target yang sama dalam kurun 30 hari', () => {
      const check = check30DayCooldown(mockHistory, 'PT Gocean Indonesia', 'Junior Business Analyst');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Cooldown aktif');
    });

    it('mengizinkan pengiriman jika perusahaan atau posisi berbeda', () => {
      const check1 = check30DayCooldown(mockHistory, 'PT Toku Kost', 'Junior Business Analyst');
      expect(check1.allowed).toBe(true);

      const check2 = check30DayCooldown(mockHistory, 'PT Gocean Indonesia', 'Frontend Developer');
      expect(check2.allowed).toBe(true);
    });
  });

  // ATURAN 4: Filter Kualitas Email HRD (Zero Bounce Policy)
  describe('Aturan 4: Filter Kualitas Email HRD', () => {
    it('menolak email non-rekruter umum (info@, support@, noreply@)', () => {
      expect(validateHrdEmailQuality('info@perusahaan.com').valid).toBe(false);
      expect(validateHrdEmailQuality('support@tokopedia.com').valid).toBe(false);
      expect(validateHrdEmailQuality('noreply@shopee.co.id').valid).toBe(false);
    });

    it('menolak email domain gratisan untuk korporat (gmail, yahoo)', () => {
      expect(validateHrdEmailQuality('hrd.ptgocean@gmail.com').valid).toBe(false);
    });

    it('menerima email whitelist rekrutmen korporat resmi', () => {
      expect(validateHrdEmailQuality('recruitment@gocean.id').valid).toBe(true);
      expect(validateHrdEmailQuality('career@paragon-corp.com').valid).toBe(true);
      expect(validateHrdEmailQuality('talent@tokukost.com').valid).toBe(true);
      expect(validateHrdEmailQuality('hr@adaro.com').valid).toBe(true);
    });
  });

  // ATURAN 5: Optimal Recruiter Timing (Waktu Emas HRD)
  describe('Aturan 5: Waktu Emas HRD', () => {
    it('mengaktifkan auto-freeze di akhir pekan (Sabtu/Minggu)', () => {
      // 2026-10-24 is a Saturday (UTC 03:00 -> WIB 10:00)
      const saturday = new Date('2026-10-24T03:00:00.000Z');
      const status = getOptimalRecruiterTimingStatus(saturday);
      expect(status.isFrozen).toBe(true);
      expect(status.reason).toContain('Auto-Freeze Akhir Pekan');
    });

    it('mendeteksi Waktu Emas di hari Selasa pukul 09:00 WIB', () => {
      // 2026-10-27 is a Tuesday (02:00 UTC = 09:00 WIB)
      const tuesdayMorning = new Date('2026-10-27T02:00:00.000Z');
      const status = getOptimalRecruiterTimingStatus(tuesdayMorning);
      expect(status.isOptimal).toBe(true);
      expect(status.reason).toContain('WAKTU EMAS HRD AKTIF');
    });
  });

  // ATURAN 6: Batas Maksimal Harian (Daily Cap 30-40 Email)
  describe('Aturan 6: Daily Cap', () => {
    it('mengizinkan pengiriman jika masih di bawah kuota cap (misal 15 dari 35)', () => {
      const quota = checkDailyBlastQuota(15, 35);
      expect(quota.allowed).toBe(true);
      expect(quota.remainingToday).toBe(20);
    });

    it('memblokir pengiriman jika kuota harian telah tercapai (misal 35 dari 35)', () => {
      const quota = checkDailyBlastQuota(35, 35);
      expect(quota.allowed).toBe(false);
      expect(quota.remainingToday).toBe(0);
      expect(quota.reason).toContain('Batas harian');
    });
  });

  // ATURAN 7: Kepatuhan Format & Subjek
  describe('Aturan 7: Kepatuhan Format & Subjek', () => {
    it('mengikuti instruksi subjek khusus jika ditentukan oleh loker', () => {
      const job = {
        title: 'Business Analyst',
        company: 'PT Bank Central Asia',
        description: 'Kirimkan CV Anda ke recruitment@bca.co.id dengan subjek [BAP-BCA] - Nama Lengkap'
      };
      const res = generateSubjectLine(job, 'Dimitri Ahmad');
      expect(res.isCustomInstruction).toBe(true);
      expect(res.subject).toBe('[BAP-BCA] - Dimitri Ahmad');
    });

    it('menggunakan format dinamis Tech Dimitri HQ jika tidak ada ketentuan khusus', () => {
      const job = { title: 'Junior Data Analyst', company: 'PT Telkom' };
      const res = generateSubjectLine(job, 'Dimitri Ahmad', 'tech');
      expect(res.isCustomInstruction).toBe(false);
      expect(res.subject).toBe('Lamaran: Junior Data Analyst – Dimitri Ahmad | AI & Data Workflow Specialist');
    });

    it('menggunakan format dinamis Engineering Dimitri HQ jika pilar delivery', () => {
      const job = { title: 'Project Coordinator', company: 'PT Wijaya Karya' };
      const res = generateSubjectLine(job, 'Dimitri Ahmad', 'engineering');
      expect(res.isCustomInstruction).toBe(false);
      expect(res.subject).toBe('Lamaran: Project Coordinator – Dimitri Ahmad | Project Delivery & Engineering');
    });
  });

});
