import { describe, it, expect } from 'vitest';
import { 
  extractJobRequirements, 
  analyzeJobCvMatch, 
  insertMissingKeywordsIntoCv 
} from '../src/lib/resume-matcher.js';

describe('Resume Matcher & Keyword Gap Analysis Engine', () => {

  const sampleJob = {
    title: 'Junior Business Analyst & Export Operations',
    company: 'PT Gocean Indonesia',
    keyRequirements: [
      'Analisis Kebutuhan Bisnis',
      'Pemodelan Flowchart / BPMN',
      'Komunikasi B2B'
    ],
    valueAddSkills: [
      'Dual-View Documentation',
      'Supply Chain Cold Chain',
      'UAT'
    ],
    description: 'Mencari kandidat yang menguasai SQL dan UAT untuk pengujian sistem ekspor perikanan.'
  };

  const sampleCandidateProfile = {
    identity: {
      name: 'Dimas Pratama',
      email: 'dimas@example.com'
    },
    summary: 'Fresh graduate berprestasi dengan spesialisasi analisis kebutuhan bisnis dan supply chain.',
    skills: {
      technical: ['Analisis Kebutuhan Bisnis', 'Supply Chain Cold Chain', 'Komunikasi B2B'],
      tools: ['Excel', 'Figma']
    },
    experience: [
      {
        company: 'PT Solusi Teknologi Nusantara',
        role: 'Junior Analyst',
        bullets: [
          'Melakukan analisis proses bisnis operasional harian.',
          'Membantu komunikasi B2B dengan supplier.'
        ]
      }
    ]
  };

  it('Mengekstrak keterampilan wajib dari objek lowongan (requirements, valueAddSkills, dan deskripsi)', () => {
    const reqs = extractJobRequirements(sampleJob);
    expect(reqs).toContain('Analisis Kebutuhan Bisnis');
    expect(reqs).toContain('Pemodelan Flowchart / BPMN');
    expect(reqs).toContain('Dual-View Documentation');
    expect(reqs).toContain('SQL');
    expect(reqs).toContain('UAT');
  });

  it('Menghitung kesesuaian kata kunci (Match Score) dan memisahkan matched vs missing keywords', () => {
    const analysis = analyzeJobCvMatch(sampleJob, sampleCandidateProfile);

    expect(analysis.matchScore).toBeGreaterThan(0);
    expect(analysis.matchScore).toBeLessThan(100); // Karena belum ada BPMN, Dual-View, SQL, UAT di profil awal
    expect(analysis.matchedKeywords).toContain('Analisis Kebutuhan Bisnis');
    expect(analysis.matchedKeywords).toContain('Komunikasi B2B');
    expect(analysis.missingKeywords).toContain('UAT');
    expect(analysis.missingKeywords).toContain('SQL');
    expect(analysis.totalRequiredCount).toBeGreaterThanOrEqual(5);
  });

  it('1-Klik Auto-Insert menyisipkan kata kunci yang hilang ke technical skills tanpa duplikasi', () => {
    const analysis = analyzeJobCvMatch(sampleJob, sampleCandidateProfile);
    const result = insertMissingKeywordsIntoCv(sampleCandidateProfile, analysis.missingKeywords);

    expect(result.addedCount).toBeGreaterThan(0);
    expect(result.updatedProfile.skills.technical).toContain('UAT');
    expect(result.updatedProfile.skills.technical).toContain('SQL');

    // Analisis ulang dengan profil yang sudah diperbarui -> Skor match melonjak!
    const reAnalysis = analyzeJobCvMatch(sampleJob, result.updatedProfile);
    expect(reAnalysis.matchScore).toBeGreaterThanOrEqual(90);
    expect(reAnalysis.grade).toBe('Sangat Cocok');
  });

});
