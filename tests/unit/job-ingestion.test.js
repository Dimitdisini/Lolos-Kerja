import { describe, it, expect } from 'vitest';
import { normalizeJobForDb, buildDatabaseJobSet } from '../../scripts/scrape/import-to-db.js';
import { parseManualTargetsCsv } from '../../scripts/scrape/import-manual.js';

describe('M4: Job Ingestion & Verification Pipeline', () => {
  describe('normalizeJobForDb: Aturan Keabsahan Email & Sumber', () => {
    it('email tanpa source_url yang valid TIDAK BOLEH menjadi apply_via=email (harus portal)', () => {
      const jobWithoutSource = normalizeJobForDb({
        company: 'PT Mencari Alamat',
        title: 'Backend Developer',
        apply_email: 'recruitment@mencarialamat.com',
        source_url: '' // Kosong / tebakan
      });

      expect(jobWithoutSource.apply_via).toBe('portal');
      expect(jobWithoutSource.email_valid).toBe(false);
    });

    it('email dengan source_url resmi berawalan http/https sah menjadi apply_via=email', () => {
      const jobWithSource = normalizeJobForDb({
        company: 'Fore Coffee',
        title: 'Barista & Store Supervisor',
        apply_email: 'career@fore.coffee',
        source_url: 'https://fore.coffee/career/',
        kind: 'recruiting'
      });

      expect(jobWithSource.apply_via).toBe('email');
      expect(jobWithSource.email_valid).toBe(true);
      expect(jobWithSource.email_source_url).toBe('https://fore.coffee/career/');
      expect(jobWithSource.email_kind).toBe('recruiting');
    });

    it('menghasilkan hash deterministik untuk idempoten upsert', () => {
      const job1 = normalizeJobForDb({
        company: 'Gocean',
        title: 'Business Analyst',
        apply_email: 'recruitment@gocean.co.id',
        source_url: 'https://gocean.co.id/careers'
      });

      const job2 = normalizeJobForDb({
        company: 'Gocean',
        title: 'Business Analyst',
        apply_email: 'recruitment@gocean.co.id',
        source_url: 'https://gocean.co.id/careers'
      });

      expect(job1.hash).toBe(job2.hash);
    });
  });

  describe('import-manual.js: Validasi CSV Target Manual', () => {
    it('menolak baris tanpa source_url atau dengan format email rusak', () => {
      const invalidCsv = `company,email,source_url,role_keys,notes
PT Tanpa Sumber,career@tanpasumber.com,,business-analyst,tanpa link sumber
PT Email Rusak,bukan-email,https://perusahaan.com/karir,tech,email rusak
PT Sah,hrd@sah.co.id,https://sah.co.id/careers,business-analyst,lengkap`;

      const { accepted, rejected } = parseManualTargetsCsv(invalidCsv);

      expect(accepted.length).toBe(1);
      expect(accepted[0].company).toBe('PT Sah');
      expect(accepted[0].apply_via).toBe('email');

      expect(rejected.length).toBe(2);
      expect(rejected.some(r => r.reason.includes('source_url'))).toBe(true);
      expect(rejected.some(r => r.reason.includes('Format email'))).toBe(true);
    });
  });
});
