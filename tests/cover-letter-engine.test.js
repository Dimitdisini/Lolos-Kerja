/**
 * tests/cover-letter-engine.test.js
 * 
 * Unit tests untuk Tailored Cover Letter Engine (Generator Surat Lamaran Cerdas)
 * Memvalidasi:
 * 1. Struktur 3 paragraf profesional
 * 2. 3 Pilihan Nada Tulisan (Modern, Professional, High Impact)
 * 3. Preservasi metrik STAR asli tanpa manipulasi data
 * 4. Adaptasi konteks industri dan budaya kerja perusahaan
 * 5. Diagnostik kesiapan surat (wordCount, readingTime, readinessScore)
 */

import { describe, it, expect } from 'vitest';
import { 
  generateTailoredCoverLetter, 
  detectIndustryContext, 
  extractStrongestMetricBullet,
  extractRelevantSkillsForCoverLetter,
  getCoverLetterDiagnostics,
  INDUSTRY_CULTURE_MAP 
} from '../src/lib/cover-letter-engine.js';

describe('Tailored Cover Letter Engine Tests', () => {
  const mockProfile = {
    identity: {
      fullName: 'Dimas Pratama',
      phone: '+62 812-3456-7890',
      email: 'dimas.pratama@gmail.com',
      linkedin: 'linkedin.com/in/dimas-pratama'
    },
    education: {
      degree: 'Sarjana Manajemen (S.M.)',
      school: 'Universitas Indonesia',
      gpa: '3.72 / 4.00 (Cum Laude)'
    },
    experience: [
      {
        company: 'PT Solusi Teknologi Nusantara',
        role: 'Junior Business Analyst Intern',
        bullets: [
          'Menganalisis 14 alur kerja operasional AS-IS dan merancang rekomendasi TO-BE berbasis BPMN 2.0 yang memangkas waktu approval sebesar 28%.',
          'Menyusun 35 dokumen User Stories berstandar Gherkin (Given-When-Then) untuk tim engineering.',
          'Mengkoordinasikan User Acceptance Testing (UAT) bersama 4 departemen lintas divisi.'
        ]
      }
    ],
    skills: {
      technical: ['Business Process Modeling (BPMN)', 'UAT', 'Requirements Engineering'],
      tools: ['Figma', 'Jira', 'SQL Basics']
    }
  };

  const mockJobTech = {
    id: 'job-1',
    title: 'Junior Business Analyst',
    company: 'PT Gocean Indonesia',
    category: 'business-operations',
    keyRequirements: ['Business Process Modeling (BPMN)', 'UAT', 'Komunikasi B2B']
  };

  const mockJobFinance = {
    id: 'job-2',
    title: 'Financial Risk Analyst',
    company: 'Bank Mandiri Digital',
    category: 'finance-banking',
    keyRequirements: ['Analisis Keuangan', 'Kepatuhan Regulasi']
  };

  describe('1. Deteksi Budaya Industri & Ekstraksi Relevansi', () => {
    it('mendeteksi kategori business-operations dengan tepat', () => {
      const culture = detectIndustryContext(mockJobTech);
      expect(culture.name).toContain('Operasional Bisnis');
      expect(culture.emphasis).toContain('efisiensi alur kerja operasional');
    });

    it('mendeteksi kategori finance-banking dengan tepat', () => {
      const culture = detectIndustryContext(mockJobFinance);
      expect(culture.name).toContain('Keuangan & Perbankan');
    });

    it('mengambil bullet dengan angka metrik tertinggi tanpa merubah angka', () => {
      const bullet = extractStrongestMetricBullet(mockProfile);
      expect(bullet).toContain('28%');
      expect(bullet).toContain('BPMN 2.0');
    });

    it('menemukan irisan keahlian yang relevan antara loker dan CV', () => {
      const skills = extractRelevantSkillsForCoverLetter(mockJobTech, mockProfile);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.some(s => s.toLowerCase().includes('bpmn') || s.toLowerCase().includes('uat'))).toBe(true);
    });
  });

  describe('2. Generasi Surat Lamaran Berdasarkan 3 Nada Tulisan', () => {
    it('menghasilkan surat dengan nada Modern & Kolaboratif (Default)', () => {
      const letter = generateTailoredCoverLetter(mockJobTech, mockProfile, { tone: 'modern' });

      // Verifikasi komponen dasar
      expect(letter).toContain('Yth. Tim Rekrutmen PT Gocean Indonesia');
      expect(letter).toContain('Dimas Pratama');
      expect(letter).toContain('Universitas Indonesia');
      expect(letter).toContain('Junior Business Analyst');
      expect(letter).toContain('PT Gocean Indonesia');

      // Verifikasi metrik asli (Anti-Fabrication)
      expect(letter).toContain('28%');

      // Verifikasi lampiran Harvard ATS
      expect(letter).toContain('CV berstandar Harvard ATS');

      // Verifikasi kontak lengkap
      expect(letter).toContain('dimas.pratama@gmail.com');
      expect(letter).toContain('+62 812-3456-7890');
    });

    it('menghasilkan surat dengan nada Formal & Korporat (Professional)', () => {
      const letter = generateTailoredCoverLetter(mockJobFinance, mockProfile, { 
        tone: 'professional',
        customEmphasis: 'mitigasi risiko operasional' 
      });

      expect(letter).toContain('Yth. Tim Rekrutmen Bank Mandiri Digital');
      expect(letter).toContain('mengajukan diri untuk bergabung dengan Bank Mandiri Digital');
      expect(letter).toContain('mitigasi risiko operasional');
      expect(letter).toContain('Bapak/Ibu');
    });

    it('menghasilkan surat dengan nada Ringkas & High-Impact (< 150 kata)', () => {
      const letter = generateTailoredCoverLetter(mockJobTech, mockProfile, { tone: 'high_impact' });
      const words = letter.trim().split(/\s+/).filter(Boolean);

      expect(words.length).toBeLessThanOrEqual(160);
      expect(letter).toContain('Yth. Tim Rekrutmen PT Gocean Indonesia');
      expect(letter).toContain('kontribusi nyata');
    });
  });

  describe('3. Diagnostik Kesiapan Surat Lamaran', () => {
    it('menghitung metrik kesiapan surat secara akurat', () => {
      const letter = generateTailoredCoverLetter(mockJobTech, mockProfile, { tone: 'modern' });
      const diag = getCoverLetterDiagnostics(letter, mockJobTech, mockProfile);

      expect(diag.wordCount).toBeGreaterThan(80);
      expect(diag.hasCandidateName).toBe(true);
      expect(diag.hasCompanyMention).toBe(true);
      expect(diag.hasRoleMention).toBe(true);
      expect(diag.hasQuantitativeMetric).toBe(true);
      expect(diag.readinessScore).toBeGreaterThanOrEqual(90);
      expect(diag.readingTimeSec).toBeGreaterThan(10);
    });

    it('memberikan skor 0 jika surat kosong', () => {
      const diag = getCoverLetterDiagnostics('', mockJobTech, mockProfile);
      expect(diag.wordCount).toBe(0);
      expect(diag.readinessScore).toBe(0);
    });
  });

  describe('4. Graceful Fallback untuk Profil Minimal', () => {
    it('tidak melempar error jika profil tidak memiliki bullet pengalaman atau IPK', () => {
      const minimalProfile = {
        identity: { fullName: 'Siti Rahma' },
        education: { school: 'Universitas Terbuka', degree: 'Sarjana Sistem Informasi' },
        experience: [],
        skills: { technical: [] }
      };

      const letter = generateTailoredCoverLetter(mockJobTech, minimalProfile);
      expect(letter).toContain('Siti Rahma');
      expect(letter).toContain('PT Gocean Indonesia');
      expect(letter).not.toContain('undefined');
      expect(letter).not.toContain('null');
    });
  });
});
