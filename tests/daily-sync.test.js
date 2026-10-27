import { describe, it, expect } from 'vitest';
import { filterJobByDimitriRules, generateJobHash } from '../scripts/scrape/daily-sync.js';

describe('Dimitri HQ - Daily Scraping Pipeline & 7 Rules Enforcer', () => {

  const sampleExistingHashes = new Set();
  const sampleAppliedHistory = [
    {
      company: 'PT Telkom Indonesia',
      title: 'Management Trainee Digital',
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 hari lalu (masih cooldown)
    }
  ];

  it('Aturan 1: Menolak lowongan kadaluarsa (> 30 hari lalu)', () => {
    const expiredJob = {
      title: 'Junior Data Analyst',
      company: 'PT Maju Bersama',
      location: 'Jakarta',
      posted_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      recruiterEmail: 'recruitment@majubersama.co.id'
    };

    const res = filterJobByDimitriRules(expiredJob, sampleExistingHashes, sampleAppliedHistory);
    expect(res.valid).toBe(false);
    expect(res.rejectionCode).toBe('EXPIRED_OR_OUT_OF_MONTH');
  });

  it('Aturan 2: Menolak lowongan di luar negeri (Overseas)', () => {
    const overseasJob = {
      title: 'Junior Software Engineer',
      company: 'Tech SG Pte Ltd',
      location: 'Singapore',
      posted_at: new Date().toISOString(),
      recruiterEmail: 'hr@techsg.com'
    };

    const res = filterJobByDimitriRules(overseasJob, sampleExistingHashes, sampleAppliedHistory);
    expect(res.valid).toBe(false);
    expect(res.rejectionCode).toBe('FOREIGN_LOCATION');
  });

  it('Aturan 2: Menerima lowongan di kota Indonesia atau Remote Indonesia', () => {
    const localJob = {
      title: 'Junior Business Analyst',
      company: 'PT Digital Nusantara',
      location: 'Bandung & Remote Indonesia',
      posted_at: new Date().toISOString(),
      recruiterEmail: 'talent@digitalnusantara.id'
    };

    const res = filterJobByDimitriRules(localJob, sampleExistingHashes, sampleAppliedHistory);
    expect(res.valid).toBe(true);
    expect(res.job.company).toBe('PT Digital Nusantara');
  });

  it('Aturan 3: Menolak lowongan yang masih dalam masa cooldown 30 hari', () => {
    const cooldownJob = {
      title: 'Management Trainee Digital',
      company: 'PT Telkom Indonesia',
      location: 'Jakarta',
      posted_at: new Date().toISOString(),
      recruiterEmail: 'recruitment@telkom.co.id'
    };

    const res = filterJobByDimitriRules(cooldownJob, sampleExistingHashes, sampleAppliedHistory);
    expect(res.valid).toBe(false);
    expect(res.rejectionCode).toBe('COOLDOWN_ACTIVE');
  });

  it('Aturan 3: Menolak lowongan duplikat yang sudah ada di katalog', () => {
    const existingHash = generateJobHash('PT Gocean Indonesia', 'Junior Business Analyst', 'Jakarta');
    const existingSet = new Set([existingHash]);

    const dupJob = {
      title: 'Junior Business Analyst',
      company: 'PT Gocean Indonesia',
      location: 'Jakarta',
      posted_at: new Date().toISOString(),
      recruiterEmail: 'recruitment@gocean.co.id'
    };

    const res = filterJobByDimitriRules(dupJob, existingSet, sampleAppliedHistory);
    expect(res.valid).toBe(false);
    expect(res.rejectionCode).toBe('DUPLICATE_CATALOG');
  });

  it('Aturan 4: Menolak lowongan ber-email non-rekruter (info@, support@) jika tanpa saluran applyUrl', () => {
    const badEmailJob = {
      title: 'Staff Operasional',
      company: 'PT Logistik Prima',
      location: 'Surabaya',
      posted_at: new Date().toISOString(),
      recruiterEmail: 'info@logistikprima.co.id'
    };

    const res = filterJobByDimitriRules(badEmailJob, sampleExistingHashes, sampleAppliedHistory);
    expect(res.valid).toBe(false);
    expect(res.rejectionCode).toBe('ZERO_BOUNCE_REJECTED');
  });

  it('Filter Senioritas: Menolak posisi level Senior / Manager / Lead untuk Fresh Graduate', () => {
    const seniorJob = {
      title: 'Senior Engineering Manager',
      company: 'PT Unicorn Teknologi',
      location: 'Jakarta',
      posted_at: new Date().toISOString(),
      recruiterEmail: 'career@unicorn.id'
    };

    const res = filterJobByDimitriRules(seniorJob, sampleExistingHashes, sampleAppliedHistory);
    expect(res.valid).toBe(false);
    expect(res.rejectionCode).toBe('SENIORITY_REJECTED');
  });

  it('Filter Anti-Penipuan: Menolak lowongan dengan kata kunci MLM atau skema berbayar', () => {
    const scamJob = {
      title: 'Admin Freelance',
      company: 'CV Sukses Mandiri',
      location: 'Jakarta',
      description: 'Wajib transfer uang muka biaya pendaftaran sebelum interview.',
      posted_at: new Date().toISOString(),
      recruiterEmail: 'recruitment@suksesmandiri.co.id'
    };

    const res = filterJobByDimitriRules(scamJob, sampleExistingHashes, sampleAppliedHistory);
    expect(res.valid).toBe(false);
    expect(res.rejectionCode).toBe('SCAM_DETECTED');
  });

  it('Aturan 7: Menghasilkan subjek dinamis pilar Dimitri HQ yang rapi', () => {
    const validJob = {
      title: 'Associate Prompt Engineer',
      company: 'PT Fleek Inovasi Mandiri',
      location: 'Jakarta (Hybrid)',
      posted_at: new Date().toISOString(),
      recruiterEmail: 'recruitment@fleekgroup.id'
    };

    const res = filterJobByDimitriRules(validJob, sampleExistingHashes, sampleAppliedHistory);
    expect(res.valid).toBe(true);
    expect(res.job.subjectFormat).toContain('Dimitri Ahmad');
    expect(res.job.subjectFormat).toContain('Associate Prompt Engineer');
  });

});
