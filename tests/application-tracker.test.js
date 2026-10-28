/**
 * tests/application-tracker.test.js
 * 
 * Unit tests untuk Application Tracker & Kanban Engine
 * Memvalidasi:
 * 1. Definisi dan konsistensi 5 tahapan (stages)
 * 2. Normalisasi record dan konversi status lama
 * 3. Perhitungan metrik performa (Response rate, Interview rate)
 * 4. Transisi status (Kanban movement)
 * 5. Pengelolaan catatan dan jadwal interview
 * 6. Ekspor data ke CSV
 */

import { describe, it, expect } from 'vitest';
import {
  APPLICATION_STAGES,
  INITIAL_APPLICATIONS,
  normalizeApplicationRecord,
  calculateTrackerMetrics,
  updateApplicationStage,
  updateApplicationNotes,
  addApplicationRecord,
  deleteApplicationRecord,
  exportApplicationsToCsv
} from '../src/lib/application-tracker.js';

describe('Application Tracker & Kanban Engine Tests', () => {
  const sampleApps = [
    {
      id: 'app-1',
      company: 'PT Unilever Indonesia',
      role: 'Management Trainee',
      email: 'hr@unilever.com',
      appliedAt: '2026-10-15T00:00:00.000Z',
      stage: 'interview'
    },
    {
      id: 'app-2',
      company: 'PT Gocean Indonesia',
      role: 'Junior Business Analyst',
      email: 'recruitment@gocean.co.id',
      appliedAt: '2026-10-20T00:00:00.000Z',
      stage: 'reviewing'
    },
    {
      id: 'app-3',
      company: 'Trinova Tech',
      role: 'Prompt Engineer',
      email: 'careers@trinova.com',
      appliedAt: '2026-10-26T00:00:00.000Z',
      stage: 'sent'
    },
    {
      id: 'app-4',
      company: 'Fintech Nusantara',
      role: 'Operations Lead',
      email: 'talent@fintech.co.id',
      appliedAt: '2026-10-10T00:00:00.000Z',
      stage: 'offering'
    }
  ];

  describe('1. Struktur Tahapan & Normalisasi Record', () => {
    it('memiliki 5 tahapan standar dengan label dan badge', () => {
      expect(APPLICATION_STAGES).toHaveLength(5);
      const stageIds = APPLICATION_STAGES.map(s => s.id);
      expect(stageIds).toEqual(['sent', 'reviewing', 'interview', 'offering', 'rejected']);
    });

    it('menormalisasi record lama dan memetakan string status ke stage id yang benar', () => {
      const legacyItem = {
        company: 'PT Test Corp',
        title: 'Software Engineer',
        status: 'Terkirim (100% Primary Inbox)'
      };
      const norm = normalizeApplicationRecord(legacyItem);
      expect(norm.stage).toBe('sent');
      expect(norm.role).toBe('Software Engineer');
      expect(norm.id).toBeDefined();
    });

    it('mengembalikan null jika input falsy', () => {
      expect(normalizeApplicationRecord(null)).toBeNull();
    });
  });

  describe('2. Perhitungan Metrik Pelacak', () => {
    it('menghitung total, jumlah per tahap, dan tingkat respon dengan benar', () => {
      const metrics = calculateTrackerMetrics(sampleApps);

      expect(metrics.total).toBe(4);
      expect(metrics.countByStage.sent).toBe(1);
      expect(metrics.countByStage.reviewing).toBe(1);
      expect(metrics.countByStage.interview).toBe(1);
      expect(metrics.countByStage.offering).toBe(1);
      expect(metrics.countByStage.rejected).toBe(0);

      // Respon: 3 dari 4 = 75%
      expect(metrics.responseRate).toBe(75);
      // Interview + Offering: 2 dari 4 = 50%
      expect(metrics.interviewRate).toBe(50);
      expect(metrics.activeInterviews).toBe(1);
      expect(metrics.activeOffers).toBe(1);
    });

    it('menangani daftar kosong tanpa error NaN', () => {
      const metrics = calculateTrackerMetrics([]);
      expect(metrics.total).toBe(0);
      expect(metrics.responseRate).toBe(0);
      expect(metrics.interviewRate).toBe(0);
    });
  });

  describe('3. Transisi Status (Kanban Movement)', () => {
    it('memperbarui stage lamaran yang dipilih', () => {
      const updated = updateApplicationStage(sampleApps, 'app-3', 'interview');
      const target = updated.find(a => a.id === 'app-3');
      expect(target.stage).toBe('interview');
      expect(target.updatedAt).toBeDefined();
    });

    it('mengabaikan stage id yang tidak valid', () => {
      const updated = updateApplicationStage(sampleApps, 'app-3', 'invalid-stage');
      const target = updated.find(a => a.id === 'app-3');
      expect(target.stage).toBe('sent');
    });
  });

  describe('4. Pengelolaan Catatan & Jadwal', () => {
    it('menambahkan catatan dan tanggal interview pada lamaran', () => {
      const interviewDate = '2026-10-30T10:00:00.000Z';
      const updated = updateApplicationNotes(sampleApps, 'app-2', 'Interview User via Zoom', interviewDate);
      const target = updated.find(a => a.id === 'app-2');

      expect(target.notes).toBe('Interview User via Zoom');
      expect(target.interviewDate).toBe(interviewDate);
    });
  });

  describe('5. Penambahan & Penghapusan Record', () => {
    it('menambahkan lamaran baru ke urutan paling atas', () => {
      const newApp = {
        company: 'PT Bank Central',
        role: 'Data Analyst',
        email: 'recruitment@bankcentral.co.id'
      };
      const updated = addApplicationRecord(sampleApps, newApp);
      expect(updated).toHaveLength(5);
      expect(updated[0].company).toBe('PT Bank Central');
      expect(updated[0].stage).toBe('sent');
    });

    it('menghapus lamaran berdasarkan id', () => {
      const updated = deleteApplicationRecord(sampleApps, 'app-1');
      expect(updated).toHaveLength(3);
      expect(updated.some(a => a.id === 'app-1')).toBe(false);
    });
  });

  describe('6. Ekspor Data ke CSV', () => {
    it('menghasilkan string CSV yang valid dengan header dan data', () => {
      const csv = exportApplicationsToCsv(sampleApps);
      expect(csv).toContain('ID,Perusahaan,Posisi,Email Rekruter,Tahap / Status,Tanggal Kirim,Catatan');
      expect(csv).toContain('PT Unilever Indonesia');
      expect(csv).toContain('PT Gocean Indonesia');
    });
  });
});
