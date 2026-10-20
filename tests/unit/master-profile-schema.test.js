import { describe, it, expect } from 'vitest';

/**
 * Validates the Unified Master Profile Data Layer schema
 * Specification from ANTIGRAVITY-SPRINT-PLAN.md Section 2.3 & EFISIENSI-DAN-LAUNCHING.md
 */
export function validateMasterProfileSchema(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object') {
    return { valid: false, errors: ['Profile must be an object'] };
  }

  // Identity checks
  if (!profile.identity || typeof profile.identity !== 'object') {
    errors.push('identity object is required');
  } else {
    if (!profile.identity.fullName || typeof profile.identity.fullName !== 'string') {
      errors.push('identity.fullName must be a non-empty string');
    }
    if (!profile.identity.email || !profile.identity.email.includes('@')) {
      errors.push('identity.email must be a valid email string');
    }
  }

  // Education checks
  if (!Array.isArray(profile.education)) {
    errors.push('education must be an array');
  } else {
    profile.education.forEach((edu, idx) => {
      if (!edu.institution || !edu.major) {
        errors.push(`education[${idx}] requires institution and major`);
      }
    });
  }

  // Experience checks (STAR format)
  if (!Array.isArray(profile.experience)) {
    errors.push('experience must be an array');
  } else {
    profile.experience.forEach((exp, idx) => {
      if (!exp.role || !exp.org) {
        errors.push(`experience[${idx}] requires role and org`);
      }
      if (!Array.isArray(exp.bullets)) {
        errors.push(`experience[${idx}].bullets must be an array of strings`);
      }
    });
  }

  // Skills checks
  if (!profile.skills || typeof profile.skills !== 'object') {
    errors.push('skills object is required');
  } else {
    if (!Array.isArray(profile.skills.technical)) errors.push('skills.technical must be an array');
    if (!Array.isArray(profile.skills.soft)) errors.push('skills.soft must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

describe('Master Profile Schema Validation', () => {
  it('validates a complete, compliant Master Profile', () => {
    const validProfile = {
      identity: {
        fullName: 'Dimitri Ahmad Saefullah Sidik',
        email: 'dimitriahmad000@gmail.com',
        phone: '+6281234567890',
        location: 'Bandung / Jakarta'
      },
      education: [
        {
          institution: 'Telkom University',
          degree: 'S1',
          major: 'Teknik Fisika',
          gpa: 3.69,
          graduationYear: 2024
        }
      ],
      experience: [
        {
          role: 'Technology Project Manager & IoT Lead',
          org: 'PT Xavortree Digital Solution',
          start: '2023',
          end: 'Present',
          type: 'work',
          bullets: [
            'Memimpin perancangan arsitektur IoT telemetri ESP32 dan modul AQMS, meningkatkan akurasi data sensor hingga 98%.',
            'Mengurangi latensi transmisi MQTT sebesar 40% dengan optimasi payload JSON.'
          ]
        }
      ],
      skills: {
        technical: ['Python', 'C++', 'Node.js', 'PostgreSQL', 'IoT / ESP32'],
        tools: ['Git', 'Docker', 'Vercel', 'Supabase'],
        soft: ['Kepemimpinan Tim', 'Manajemen Proyek', 'Komunikasi Stakeholder'],
        languages: ['Bahasa Indonesia (Native)', 'English (Professional)']
      },
      certifications: [],
      target_roles: ['Project Manager', 'IoT Engineer', 'AI Solutions Architect'],
      preferred_locations: ['Jakarta', 'Bandung', 'Remote']
    };

    const result = validateMasterProfileSchema(validProfile);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('catches missing identity fields and invalid structure', () => {
    const invalidProfile = {
      identity: {
        fullName: '',
        email: 'invalid-email'
      },
      education: 'Not an array',
      experience: [
        { role: 'Engineer' } // Missing org and bullets
      ],
      skills: null
    };

    const result = validateMasterProfileSchema(invalidProfile);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
    expect(result.errors.some(e => e.includes('fullName'))).toBe(true);
    expect(result.errors.some(e => e.includes('education must be an array'))).toBe(true);
  });
});
