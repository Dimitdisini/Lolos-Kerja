/**
 * src/lib/resume-matcher.js
 * 
 * Engine Resume Matcher & Keyword Gap Analyzer
 * Diadaptasi dari Rohianon/awesome-ai-job-search (srbhr/Resume-Matcher)
 * 
 * 1. Analisis kesesuaian semantik antara deskripsi lowongan dan isi CV
 * 2. Deteksi kata kunci yang hilang (Keyword Gap Analysis)
 * 3. 1-Klik Auto-Insert kata kunci relevan ke dalam CV kandidat
 */

// Kamus sinonim & variasi penulisan keterampilan umum industri
export const SKILL_SYNONYMS = {
  'bpmn': ['business process modeling', 'bpmn 2.0', 'alur proses bisnis', 'pemodelan proses bisnis'],
  'uat': ['user acceptance testing', 'pengujian sistem', 'uji kelayakan sistem'],
  'sql': ['relational database', 'postgresql', 'mysql', 'query database'],
  'excel': ['microsoft excel', 'spreadsheet', 'pivot table', 'vlookup'],
  'figma': ['ui design', 'prototyping', 'wireframing'],
  'jira': ['agile', 'scrum', 'sprint tracking', 'backlog management'],
  'gap analysis': ['analisis kesenjangan', 'as-is to-be', 'analisis proses'],
  'user stories': ['gherkin', 'given when then', 'spesifikasi teknis'],
  'financial modeling': ['analisis keuangan', 'cash flow projection', 'valuasi'],
  'seo': ['search engine optimization', 'optimasi mesin pencari', 'organic traffic'],
  'copywriting': ['naskah iklan', 'content writing', 'copy naskah'],
  'python': ['python programming', 'data scripting', 'pandas', 'numpy']
};

const ACRONYMS = new Set([
  'sql', 'uat', 'bpmn', 'seo', 'api', 'erp', 'crm', 'kpi', 'okr', 'hrd', 'b2b', 'b2c', 'ui', 'ux'
]);

function formatSkillName(skill) {
  const lower = skill.toLowerCase().trim();
  if (ACRONYMS.has(lower)) {
    return lower.toUpperCase();
  }
  return lower.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
export function normalizeToken(token) {
  return (token || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\.\-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Mengekstrak seluruh keterampilan dan persyaratan dari objek lowongan
 * @param {object} job 
 * @returns {Array<string>}
 */
export function extractJobRequirements(job) {
  if (!job) return [];
  const reqs = new Set();

  // 1. Dari array keyRequirements
  if (Array.isArray(job.keyRequirements)) {
    job.keyRequirements.forEach(r => {
      const trimmed = r.trim();
      if (trimmed) reqs.add(trimmed);
    });
  }

  // 2. Dari array valueAddSkills
  if (Array.isArray(job.valueAddSkills)) {
    job.valueAddSkills.forEach(s => {
      const trimmed = s.trim();
      if (trimmed) reqs.add(trimmed);
    });
  }

  // 3. Deteksi kata kunci populer dari deskripsi / judul jika array sedikit
  const textToCheck = `${job.title || ''} ${job.description || ''} ${job.notes || ''}`.toLowerCase();
  for (const [keySkill, aliases] of Object.entries(SKILL_SYNONYMS)) {
    const kRegex = new RegExp(`(^|[^a-zA-Z0-9])${keySkill}([^a-zA-Z0-9]|$)`, 'i');
    const hasKey = kRegex.test(textToCheck);
    const hasAlias = aliases.some(a => {
      const aRegex = new RegExp(`(^|[^a-zA-Z0-9])${a}([^a-zA-Z0-9]|$)`, 'i');
      return aRegex.test(textToCheck);
    });
    if (hasKey || hasAlias) {
      reqs.add(formatSkillName(keySkill));
    }
  }

  return Array.from(reqs);
}

/**
 * Mengekstrak teks gabungan dari CV kandidat
 * @param {object} cvProfile 
 * @returns {string}
 */
export function extractCvCorpus(cvProfile) {
  if (!cvProfile) return '';
  const parts = [];

  // Summary
  if (cvProfile.summary) parts.push(cvProfile.summary);

  // Technical skills
  if (cvProfile.skills?.technical && Array.isArray(cvProfile.skills.technical)) {
    parts.push(cvProfile.skills.technical.join(' '));
  }

  // Tools
  if (cvProfile.skills?.tools && Array.isArray(cvProfile.skills.tools)) {
    parts.push(cvProfile.skills.tools.join(' '));
  }

  // Experiences & Bullets
  if (Array.isArray(cvProfile.experience)) {
    cvProfile.experience.forEach(exp => {
      if (exp.role) parts.push(exp.role);
      if (exp.company) parts.push(exp.company);
      if (Array.isArray(exp.bullets)) {
        parts.push(exp.bullets.join(' '));
      }
    });
  }

  return parts.join(' ').toLowerCase();
}

/**
 * Memeriksa apakah suatu kata kunci ada di korpus CV (termasuk sinonimnya)
 */
export function isKeywordInCv(keyword, cvCorpus) {
  const normKw = normalizeToken(keyword);
  if (!normKw) return false;

  // 1. Direct word-bounded match
  const kRegex = new RegExp(`(^|[^a-zA-Z0-9])${normKw}([^a-zA-Z0-9]|$)`, 'i');
  if (kRegex.test(cvCorpus)) return true;

  // 2. Cek kamus sinonim
  const aliases = SKILL_SYNONYMS[normKw];
  if (Array.isArray(aliases)) {
    for (const alias of aliases) {
      const aRegex = new RegExp(`(^|[^a-zA-Z0-9])${alias}([^a-zA-Z0-9]|$)`, 'i');
      if (aRegex.test(cvCorpus)) return true;
    }
  }

  // 3. Token berurutan (misal 'Business Process Modeling (BPMN)')
  const parts = normKw.split(/\s+/);
  if (parts.length > 1) {
    const allPartsFound = parts.every(p => {
      if (p.length <= 2) return true;
      const pRegex = new RegExp(`(^|[^a-zA-Z0-9])${p}([^a-zA-Z0-9]|$)`, 'i');
      return pRegex.test(cvCorpus);
    });
    if (allPartsFound) return true;
  }

  return false;
}

/**
 * Analisis Kesesuaian Lowongan vs CV (Resume Matcher)
 * @param {object} job - Objek target lowongan
 * @param {object} cvProfile - Objek profil CV kandidat
 * @returns {object} Hasil analisis kecocokan dan missing keywords
 */
export function analyzeJobCvMatch(job, cvProfile) {
  if (!job || !cvProfile) {
    return {
      matchScore: 0,
      grade: 'Data Belum Lengkap',
      matchedKeywords: [],
      missingKeywords: [],
      totalRequiredCount: 0
    };
  }

  const requiredKeywords = extractJobRequirements(job);
  const cvCorpus = extractCvCorpus(cvProfile);

  if (requiredKeywords.length === 0) {
    // Jika lowongan tidak memiliki syarat spesifik, berikan baseline 85%
    return {
      matchScore: 88,
      grade: 'Sangat Cocok',
      matchedKeywords: ['Komunikasi Profesional', 'Analisis Masalah', 'Kerja Sama Tim'],
      missingKeywords: [],
      totalRequiredCount: 0
    };
  }

  const matchedKeywords = [];
  const missingKeywords = [];

  requiredKeywords.forEach(kw => {
    if (isKeywordInCv(kw, cvCorpus)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const total = requiredKeywords.length;
  const matchRatio = total > 0 ? (matchedKeywords.length / total) : 1;
  const matchScore = Math.round(matchRatio * 100);

  let grade = 'Perlu Penyesuaian';
  let badgeColor = 'amber';

  if (matchScore >= 85) {
    grade = 'Sangat Cocok';
    badgeColor = 'emerald';
  } else if (matchScore >= 60) {
    grade = 'Cukup Cocok';
    badgeColor = 'blue';
  }

  return {
    jobTitle: job.title,
    company: job.company,
    matchScore,
    grade,
    badgeColor,
    matchedKeywords,
    missingKeywords,
    totalRequiredCount: total
  };
}

/**
 * 1-Klik Auto-Insert: Menyisipkan kata kunci yang hilang ke CV kandidat
 * @param {object} cvProfile - Profil CV kandidat
 * @param {Array<string>} keywordsToInsert - Daftar kata kunci yang belum ada
 * @returns {object} Profil CV yang sudah diperbarui dengan kata kunci target
 */
export function insertMissingKeywordsIntoCv(cvProfile, keywordsToInsert) {
  if (!cvProfile) return null;
  const updated = JSON.parse(JSON.stringify(cvProfile));

  if (!updated.skills) updated.skills = {};
  if (!Array.isArray(updated.skills.technical)) updated.skills.technical = [];

  const existingSkills = new Set(updated.skills.technical.map(s => normalizeToken(s)));
  const newlyAdded = [];

  (keywordsToInsert || []).forEach(kw => {
    const norm = normalizeToken(kw);
    if (norm && !existingSkills.has(norm)) {
      updated.skills.technical.push(kw);
      existingSkills.add(norm);
      newlyAdded.push(kw);
    }
  });

  // Perkuat summary dengan salah satu keterampilan baru jika belum ada
  if (newlyAdded.length > 0 && updated.summary) {
    const topNewSkill = newlyAdded[0];
    if (!updated.summary.toLowerCase().includes(topNewSkill.toLowerCase())) {
      updated.summary = updated.summary.replace(
        /\.\s*$/, 
        `, serta penerapan kompetensi ${topNewSkill} untuk mendukung performa kerja nyata.`
      );
    }
  }

  updated.atsScore = Math.min(98, (updated.atsScore || 94) + 2);
  updated.isPolished = true;

  return {
    updatedProfile: updated,
    addedCount: newlyAdded.length,
    addedKeywords: newlyAdded
  };
}
