import { describe, it, expect } from 'vitest';
import { parseCvTextToProfile, calculateAtsHealthDiagnosis, polishToHarvardAts } from '../src/lib/cv-parser.js';

describe('OpenResume Client-Side CV Parser & ATS Diagnosis Engine', () => {

  const sampleMessyCvText = `
    Curriculum Vitae
    Rangga Daniswara
    rangga.daniswara@gmail.com | 081234567890
    Universitas Gadjah Mada (UGM)
    Sarjana Manajemen - IPK 3.65
    
    Pengalaman Kerja:
    PT Maju Lancar Indonesia
    Staff Magang Operasional
    - Bertanggung jawab atas pengecekan data harian
    - Membantu dalam membuat laporan bulanan
    - Melakukan pekerjaan administrasi kantor
    
    Keahlian:
    Excel, PowerPoint, Komunikasi, SQL
  `;

  it('Ekstraksi entitas dasar (Nama, Email, Telepon, Kampus, IPK, Keahlian)', () => {
    const profile = parseCvTextToProfile(sampleMessyCvText);
    expect(profile.identity.name).toBe('Rangga Daniswara');
    expect(profile.identity.email).toBe('rangga.daniswara@gmail.com');
    expect(profile.identity.phone).toBe('081234567890');
    expect(profile.education.school).toContain('Universitas Gadjah Mada');
    expect(profile.education.gpa).toContain('3.65');
    expect(profile.skills.technical).toContain('SQL');
  });

  it('Mendeteksi kelemahan ATS pada CV yang minim angka dan banyak kalimat pasif', () => {
    const profile = parseCvTextToProfile(sampleMessyCvText);
    const diagnosis = calculateAtsHealthDiagnosis(sampleMessyCvText, profile);

    expect(diagnosis.score).toBeLessThan(65); // Nilai rendah karena minim metrik & pasif
    expect(diagnosis.isPassingAts).toBe(false);
    expect(diagnosis.passivePhrasesCount).toBeGreaterThan(0);
    expect(diagnosis.metricsFoundCount).toBeLessThan(3);
    expect(diagnosis.topFlaws.length).toBeGreaterThanOrEqual(1);
  });

  it('Mendeteksi skor tinggi pada CV yang kaya metrik dan kata kerja aksi STAR', () => {
    const highQualityCv = `
      Dimas Pratama
      dimas.pratama@gmail.com | +62 812-3456-7890 | Jakarta Selatan, Indonesia | linkedin.com/in/dimas-ats
      Universitas Indonesia - Sarjana Manajemen (S.M.) - IPK: 3.72
      
      Pengalaman Kerja:
      PT Solusi Teknologi Nusantara | Junior Business Analyst
      - Menganalisis 14 alur kerja operasional dan merancang rekomendasi TO-BE berbasis BPMN 2.0 yang memangkas waktu approval sebesar 28%.
      - Menyusun 35 dokumen User Stories berstandar Gherkin tanpa ada revisi mayor saat sprint review.
      - Mengkoordinasikan User Acceptance Testing (UAT) bersama 4 departemen dan menyelesaikan 100% bug blocker.
      
      Keahlian: BPMN, SQL, Tableau, Figma, Jira, UAT
    `;

    const profile = parseCvTextToProfile(highQualityCv);
    const diagnosis = calculateAtsHealthDiagnosis(highQualityCv, profile);

    expect(diagnosis.score).toBeGreaterThanOrEqual(85);
    expect(diagnosis.isPassingAts).toBe(true);
    expect(diagnosis.metricsFoundCount).toBeGreaterThanOrEqual(3);
    expect(diagnosis.starVerbsFoundCount).toBeGreaterThanOrEqual(3);
  });

  it('polishToHarvardAts merombak CV menjadi standar Harvard A4 dengan skor 94+', () => {
    const rawProfile = parseCvTextToProfile(sampleMessyCvText);
    const polished = polishToHarvardAts(rawProfile);

    expect(polished.isPolished).toBe(true);
    expect(polished.atsScore).toBeGreaterThanOrEqual(94);
    expect(polished.experience[0].bullets[0]).toContain('28%');
    expect(polished.identity.name).toBe('Rangga Daniswara');
  });

});
