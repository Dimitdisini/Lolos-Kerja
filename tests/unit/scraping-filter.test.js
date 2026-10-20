import { describe, it, expect } from 'vitest';
import { generateJobHash, isFreshGradEligible } from '../../scripts/scrape/run.js';

describe('Scraping Ingestion & Seniority Filter (/scripts/scrape/run.js)', () => {
  it('generates deterministic SHA-1 hash for identical job triples', () => {
    const hash1 = generateJobHash('Software Engineer Intern', 'Gojek', 'Jakarta');
    const hash2 = generateJobHash('  Software Engineer INTERN ', 'gojek  ', 'JAKARTA');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(40);
  });

  it('generates different hash for different companies or titles', () => {
    const hashA = generateJobHash('Junior Frontend', 'Tokopedia', 'Jakarta');
    const hashB = generateJobHash('Junior Frontend', 'Shopee', 'Jakarta');
    expect(hashA).not.toBe(hashB);
  });

  it('rejects senior, executive, and management positions from fresh graduate catalog', () => {
    const seniorTitles = [
      'Head of Engineering',
      'Engineering Director',
      'Vice President of Product',
      'VP Operations',
      'General Manager F&B',
      'Senior Backend Engineer',
      'Sr. Data Analyst',
      'Project Manager Lead',
      'Marketing Manager',
      'Principal Architect',
      'Chief Technology Officer',
      'Co-Founder & CEO'
    ];

    seniorTitles.forEach(title => {
      expect(isFreshGradEligible(title), `Should reject senior title: ${title}`).toBe(false);
    });
  });

  it('approves fresh graduate, junior, intern, and entry-level positions', () => {
    const freshGradTitles = [
      'Junior Web Developer',
      'Software Engineer Trainee',
      'Management Trainee Batch 2024',
      'Graduate Development Program',
      'Customer Support Officer',
      'Operations Associate',
      'UI/UX Design Intern',
      'Junior Business Analyst',
      'Staff Administrasi dan Operasional',
      'Account Executive Junior'
    ];

    freshGradTitles.forEach(title => {
      expect(isFreshGradEligible(title), `Should accept fresh grad title: ${title}`).toBe(true);
    });
  });
});
