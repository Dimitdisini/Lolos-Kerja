/**
 * src/lib/cover-letter-engine.js
 * 
 * TAILORED COVER LETTER ENGINE (GENERATOR SURAT LAMARAN CERDAS)
 * Ekosistem Dimitri HQ - Lolos Kerja V2
 * 
 * Menghasilkan surat lamaran 3 paragraf berstandar profesional yang menghubungkan
 * latar belakang CV pelamar (metrik STAR nyata) dengan spesifikasi pekerjaan
 * dan budaya perusahaan target.
 * 
 * Fitur Utama:
 * 1. 3 Pilihan Nada Tulisan (Modern Kolaboratif, Formal Korporat, Ringkas High-Impact)
 * 2. Adaptasi Konteks Industri & Budaya Perusahaan
 * 3. Integrasi Metrik STAR Tanpa Rekayasa Angka (Anti-AI Slop)
 * 4. Analisis Diagnostik Kesiapan Surat (Word Count, Reading Time, Metrik Score)
 */

import { extractJobRequirements } from './resume-matcher.js';

// Pemetaan Nilai & Budaya Perusahaan berdasarkan Kategori / Kata Kunci Industri
export const INDUSTRY_CULTURE_MAP = {
  'it-software': {
    name: 'Teknologi & Piranti Lunak',
    emphasis: 'inovasi produk digital tangkas, kode berkualitas tinggi, dan pemecahan masalah teknis',
    culturePhrase: 'pengembangan produk yang cepat dan berorientasi pada kepuasan pengguna akhir'
  },
  'business-operations': {
    name: 'Operasional Bisnis & Rantai Pasok',
    emphasis: 'efisiensi alur kerja operasional, standardisasi proses (SOP), dan kepatuhan standar mutu',
    culturePhrase: 'keandalan operasional serta koordinasi lintas pemangku kepentingan yang terstruktur'
  },
  'marketing-creative': {
    name: 'Pemasaran & Pertumbuhan',
    emphasis: 'pertumbuhan audiens terukur, performa akuisisi multi-kanal, dan komunikasi brand berdampak',
    culturePhrase: 'pendekatan berbasis data dalam mengoptimalkan konversi dan retensi pengguna'
  },
  'finance-banking': {
    name: 'Keuangan & Perbankan',
    emphasis: 'akurasi analisis data keuangan, kepatuhan regulasi, dan integritas mitigasi risiko',
    culturePhrase: 'presisi tata kelola finansial dan efisiensi pelaporan berbasis transparansi data'
  },
  'ops-mt': {
    name: 'Management Trainee & Leadership',
    emphasis: 'daya adaptasi tinggi, kepemimpinan proyek lintas fungsi, dan penyelesaian masalah analitis',
    culturePhrase: 'pembentukan calon pemimpin yang memiliki ketangkasan eksekusi dan visi bisnis menyeluruh'
  },
  'general': {
    name: 'Korporat Profesional',
    emphasis: 'standar kerja profesional berorientasi hasil, kolaborasi tim yang solid, dan efisiensi waktu',
    culturePhrase: 'reputasi profesional serta komitmen tinggi terhadap kualitas layanan dan pertumbuhan bisnis'
  }
};

/**
 * Mendeteksi kategori industri terbaik dari objek lowongan
 * @param {object} job 
 * @returns {object} Context budaya industri
 */
export function detectIndustryContext(job) {
  if (!job) return INDUSTRY_CULTURE_MAP['general'];

  const category = (job.category || '').toLowerCase();
  if (INDUSTRY_CULTURE_MAP[category]) {
    return INDUSTRY_CULTURE_MAP[category];
  }

  const text = `${job.title || ''} ${job.description || ''} ${job.notes || ''}`.toLowerCase();
  if (/software|developer|frontend|backend|fullstack|devops|engineer|data|ai|python/i.test(text)) {
    return INDUSTRY_CULTURE_MAP['it-software'];
  }
  if (/finance|akuntansi|accounting|pajak|tax|audit|perbankan|bank/i.test(text)) {
    return INDUSTRY_CULTURE_MAP['finance-banking'];
  }
  if (/marketing|growth|content|social media|seo|copywriting|creative/i.test(text)) {
    return INDUSTRY_CULTURE_MAP['marketing-creative'];
  }
  if (/supply chain|logistics|operasional|operations|warehouse|export|import/i.test(text)) {
    return INDUSTRY_CULTURE_MAP['business-operations'];
  }
  if (/management trainee|mt|leadership|officer/i.test(text)) {
    return INDUSTRY_CULTURE_MAP['ops-mt'];
  }

  return INDUSTRY_CULTURE_MAP['general'];
}

/**
 * Mengambil poin pencapaian terkuat pelamar (STAR bullet) yang mengandung metrik angka
 * @param {object} profile 
 * @returns {string|null}
 */
export function extractStrongestMetricBullet(profile) {
  if (!profile || !Array.isArray(profile.experience)) return null;

  for (const exp of profile.experience) {
    if (Array.isArray(exp.bullets)) {
      // Cari bullet yang memiliki angka atau persen
      const metricBullet = exp.bullets.find(b => /\b\d+(?:[\.,]\d+)?%?|\b\d+\b/.test(b));
      if (metricBullet) return metricBullet.trim();
    }
  }

  // Fallback ke bullet pertama pengalaman mana pun jika tidak ada angka
  const firstExp = profile.experience[0];
  if (firstExp && Array.isArray(firstExp.bullets) && firstExp.bullets[0]) {
    return firstExp.bullets[0].trim();
  }

  return null;
}

/**
 * Mengambil keahlian relevan yang bersilangan antara CV dan persyaratan loker
 * @param {object} job 
 * @param {object} profile 
 * @returns {Array<string>}
 */
export function extractRelevantSkillsForCoverLetter(job, profile) {
  const jobReqs = extractJobRequirements(job);
  const candSkills = [
    ...(profile?.skills?.technical || []),
    ...(profile?.skills?.tools || [])
  ];

  if (candSkills.length === 0) {
    return ['analisis proses bisnis', 'perancangan alur kerja terstruktur', 'kolaborasi tim'];
  }

  const matched = [];
  const candLower = candSkills.map(s => s.toLowerCase());

  // Prioritaskan skill yang cocok dengan requirement loker
  for (const req of jobReqs) {
    const reqLower = req.toLowerCase();
    const foundIdx = candLower.findIndex(cs => cs.includes(reqLower) || reqLower.includes(cs));
    if (foundIdx !== -1 && !matched.includes(candSkills[foundIdx])) {
      matched.push(candSkills[foundIdx]);
    }
  }

  // Jika belum ada 3 skill, lengkapi dengan top skill dari CV pelamar
  for (const skill of candSkills) {
    if (matched.length >= 4) break;
    if (!matched.includes(skill)) {
      matched.push(skill);
    }
  }

  return matched;
}

/**
 * Generator Utama Surat Lamaran Cerdas
 * 
 * @param {object} job Objek lowongan pekerjaan
 * @param {object} candidateProfile Profil kandidat berstandar master
 * @param {object} options Konfigurasi generator { tone: 'modern'|'professional'|'high_impact', customEmphasis: '' }
 * @returns {string} Teks lengkap surat lamaran 3 paragraf
 */
export function generateTailoredCoverLetter(job, candidateProfile, options = {}) {
  const tone = options.tone || 'modern';
  const customEmphasis = options.customEmphasis || '';

  const compName = (job?.company || 'Perusahaan Target').trim();
  const roleTitle = (job?.title || 'Posisi Target').trim();

  // Data Pelamar
  const candName = candidateProfile?.identity?.fullName || 'Kandidat Pelamar';
  const candDegree = candidateProfile?.education?.degree || 'Sarjana';
  const candSchool = candidateProfile?.education?.school || 'Universitas Terkemuka';
  const candGpa = candidateProfile?.education?.gpa || '';
  const candPhone = candidateProfile?.identity?.phone || '';
  const candEmail = candidateProfile?.identity?.email || '';
  const candLinkedin = candidateProfile?.identity?.linkedin || '';

  // Konteks Budaya & Loker
  const culture = detectIndustryContext(job);
  const relevantSkills = extractRelevantSkillsForCoverLetter(job, candidateProfile).slice(0, 3).join(', ');
  const strongestBullet = extractStrongestMetricBullet(candidateProfile);

  // Bagian Gpa text jika ada Cum Laude / angka tinggi
  const gpaSnippet = candGpa ? ` dengan IPK ${candGpa}` : '';

  // 1. NADA RINGKAS & HIGH-IMPACT (< 150 Kata)
  if (tone === 'high_impact') {
    const proofSentence = strongestBullet
      ? `Pada pengalaman sebelumnya, saya berhasil membuktikan kontribusi nyata: "${strongestBullet}".`
      : `Saya memiliki spesialisasi dalam ${relevantSkills} yang siap langsung diimplementasikan sejak hari pertama.`;

    return `Yth. Tim Rekrutmen ${compName},

Saya bermaksud mengajukan lamaran untuk posisi ${roleTitle} di ${compName}. Sebagai lulusan ${candDegree} dari ${candSchool}${gpaSnippet}, saya memiliki fondasi kuat dalam ${relevantSkills}.

${proofSentence} Dengan dedikasi tinggi terhadap ${culture.emphasis}, saya yakin dapat memperkuat efisiensi kerja tim ${compName} secara terukur.

Terlampir CV berstandar Harvard ATS dan portofolio pencapaian saya. Saya sangat menantikan kesempatan untuk berdiskusi lebih lanjut mengenai kontribusi yang dapat saya berikan.

Hormat saya,
${candName}
${[candPhone, candEmail, candLinkedin].filter(Boolean).join(' | ')}`;
  }

  // 2. NADA FORMAL & KORPORAT (Untuk BUMN, Perbankan, Korporasi Besar)
  if (tone === 'professional') {
    const proofSentence = strongestBullet
      ? `Selama menjalankan tugas profesional sebelumnya, saya telah mengaplikasikan metodologi kerja terstruktur dengan pencapaian konkrit, di antaranya: ${strongestBullet}.`
      : `Berdasarkan rekam jejak akademis dan pengalaman kerja saya, saya memiliki kompetensi solid dalam ${relevantSkills} yang berorientasi pada kepatuhan mutu dan efisiensi organisasi.`;

    const customSnippet = customEmphasis
      ? ` Secara khusus, saya juga memfokuskan keahlian pada ${customEmphasis} guna mendukung sasaran strategis divisi.`
      : '';

    return `Yth. Tim Rekrutmen ${compName},

Perkenalkan saya ${candName}, lulusan ${candDegree} dari ${candSchool}${gpaSnippet}. Melalui surat ini, perkenankan saya mengajukan diri untuk bergabung dengan ${compName} guna mengemban tanggung jawab pada posisi ${roleTitle}. Saya mengikuti rekam jejak ${compName} yang senantiasa menjunjung tinggi ${culture.culturePhrase}.

Dalam kapasitas profesional saya, saya memadukan penguasaan atas ${relevantSkills} untuk memastikan setiap proses bisnis berjalan dengan presisi tinggi. ${proofSentence}${customSnippet} Keterampilan analitis dan ketelitian ini saya yakini selaras dengan standar keunggulan yang senantiasa dijaga oleh ${compName}.

Bersama surat lamaran ini, saya lampirkan dokumen Curriculum Vitae berstandar Harvard ATS beserta portofolio pencapaian kerja untuk menjadi bahan pertimbangan Bapak/Ibu. Besar harapan saya untuk memperoleh kesempatan wawancara tatap muka maupun daring agar dapat memaparkan kualifikasi saya secara lebih komprehensif.

Atas perhatian dan kesempatan yang Bapak/Ibu berikan, saya sampaikan terima kasih.

Hormat saya,
${candName}
${[candPhone, candEmail, candLinkedin].filter(Boolean).join(' | ')}`;
  }

  // 3. NADA MODERN & KOLABORATIF (Default - Ideal untuk Tech, Startup, & Modern Corp)
  const proofSentence = strongestBullet
    ? `Di pengalaman saya sebelumnya, saya terbiasa menerjemahkan tantangan bisnis menjadi solusi terukur, seperti keberhasilan dalam ${strongestBullet.charAt(0).toLowerCase() + strongestBullet.slice(1)}.`
    : `Saya terbiasa berkolaborasi lintas tim untuk menyederhanakan alur kerja yang kompleks dan mengawal eksekusi proyek hingga tuntas.`;

  const customSnippet = customEmphasis
    ? ` Fokus utama saya adalah memastikan integrasi ${customEmphasis} dapat mengakselerasi produktivitas tim.`
    : '';

  return `Yth. Tim Rekrutmen ${compName},

Perkenalkan saya ${candName}, lulusan ${candDegree} dari ${candSchool}${gpaSnippet}. Melalui surat ini, saya dengan antusias mengajukan lamaran untuk posisi ${roleTitle} di ${compName}. Saya sangat tertarik dengan komitmen ${compName} dalam ${culture.culturePhrase}.

Dengan latar belakang keahlian dalam ${relevantSkills}, saya siap memberikan kontribusi nyata dalam mendorong target tim. ${proofSentence}${customSnippet} Saya meyakini bahwa kombinasi kemampuan analisis mendalam dan komunikasi yang proaktif akan mempercepat pencapaian ${culture.emphasis} di ${compName}.

Bersama surat ini, saya lampirkan CV berstandar Harvard ATS serta tautan portofolio pencapaian kerja saya. Saya sangat terbuka untuk kesempatan diskusi lebih lanjut mengenai bagaimana saya dapat berkontribusi positif bagi pertumbuhan ${compName}.

Terima kasih atas waktu dan perhatian Bapak/Ibu.

Hormat saya,
${candName}
${[candPhone, candEmail, candLinkedin].filter(Boolean).join(' | ')}`;
}

/**
 * Menganalisis metrik kualitas dan kesiapan surat lamaran
 * @param {string} letterText Teks surat lamaran
 * @param {object} job Objek lowongan
 * @param {object} profile Profil kandidat
 * @returns {object} Metrik diagnosa surat lamaran
 */
export function getCoverLetterDiagnostics(letterText, job, profile) {
  if (!letterText) {
    return {
      wordCount: 0,
      charCount: 0,
      readingTimeSec: 0,
      hasCandidateName: false,
      hasCompanyMention: false,
      hasRoleMention: false,
      hasQuantitativeMetric: false,
      readinessScore: 0
    };
  }

  const words = letterText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = letterText.length;
  const readingTimeSec = Math.max(10, Math.round((wordCount / 200) * 60)); // Rata-rata 200 kata/menit

  const candName = profile?.identity?.fullName || '';
  const compName = job?.company || '';
  const roleTitle = job?.title || '';

  const hasCandidateName = candName ? letterText.includes(candName) : true;
  const hasCompanyMention = compName ? letterText.toLowerCase().includes(compName.toLowerCase()) : false;
  const hasRoleMention = roleTitle ? letterText.toLowerCase().includes(roleTitle.toLowerCase()) : false;
  
  // Deteksi angka metrik (misal: 28%, 35, dsb)
  const hasQuantitativeMetric = /\b\d+(?:[\.,]\d+)?%?|\b\d+\b/.test(letterText);

  // Hitung Readiness Score (0 - 100)
  let score = 50;
  if (hasCompanyMention) score += 15;
  if (hasRoleMention) score += 15;
  if (hasQuantitativeMetric) score += 10;
  if (wordCount >= 100 && wordCount <= 260) score += 10; // Rentang panjang ideal surat lamaran

  return {
    wordCount,
    charCount,
    readingTimeSec,
    hasCandidateName,
    hasCompanyMention,
    hasRoleMention,
    hasQuantitativeMetric,
    readinessScore: Math.min(100, score)
  };
}
