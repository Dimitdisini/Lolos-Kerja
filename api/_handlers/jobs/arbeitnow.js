/**
 * /api/jobs/arbeitnow.js: Arbeitnow Free Remote & Tech Job Board API Ingestor
 * Fetches fresh job listings from Arbeitnow free API
 * Docs: https://arbeitnow.com/api (Free, no auth needed, CORS-friendly)
 * Node.js ESM Vercel Serverless Function
 */

import { applyRateLimit } from '../../_lib/rateLimit.js';

// Anti-penipuan: kata kunci iklan berbayar, kursus, skema komisi, atau MLM
const SCAM_REGEX = /\b(invest|investasi|commission only|mlm|training fee|biaya pelatihan|bayar|investasi awal|join fee|uang muka|money back|pay to work)\b/i;

// Filter relevansi teknologi & digital
const TECH_REGEX = /\b(software|developer|engineer|tech|frontend|backend|fullstack|web|data|qa|testing|devops|cloud|ai|machine learning|designer|ui|ux|product|system|analyst|it|security|mobile|ios|android|python|javascript|typescript|react|vue|node|golang|java|c\+\+|sql|database|cyber)\b/i;

/**
 * Validasi dan pembersihan satu item dari Arbeitnow
 * @param {object} item
 * @param {number} nowMs
 * @returns {object|null}
 */
function processArbeitnowItem(item, nowMs) {
  if (!item || typeof item !== 'object') return null;

  // 1. Validation Gate: Perusahaan harus jelas
  const company = (item.company_name || '').trim();
  if (!company || company.length < 2 || /^(confidential|unknown|n\/a|anonymous|personal)$/i.test(company)) {
    return null;
  }

  // 2. Validation Gate: Batas kedaluwarsa 30 hari (created_at epoch in seconds/ms)
  const rawCreatedAt = item.created_at;
  if (!rawCreatedAt) return null;
  const createdMs = rawCreatedAt > 1e11 ? rawCreatedAt : rawCreatedAt * 1000;
  const ageInDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24);
  if (isNaN(ageInDays) || ageInDays > 30 || ageInDays < -1) {
    return null; // Skip jika lebih dari 30 hari
  }

  // 3. Validation Gate: Anti-penipuan & kursus berbayar
  const textContent = `${item.title || ''} ${item.description || ''}`;
  if (SCAM_REGEX.test(textContent)) {
    return null;
  }

  // 4. Filter Remote: Harus mendukung remote
  const isRemote = Boolean(
    item.remote === true ||
    /remote|wfh|anywhere|work from home/i.test(item.location || '') ||
    (Array.isArray(item.tags) && item.tags.some(t => /remote/i.test(String(t))))
  );
  if (!isRemote) {
    return null;
  }

  // 5. Filter Tech-friendly: Judul atau tags relevan dengan teknologi
  const isTechFriendly = Boolean(
    TECH_REGEX.test(item.title || '') ||
    (Array.isArray(item.tags) && item.tags.some(t => TECH_REGEX.test(String(t))))
  );
  if (!isTechFriendly) {
    return null;
  }

  // Transform ke format standar curatedJobsDatabase
  const postDate = new Date(createdMs);
  const formattedPostedAt = !isNaN(postDate.getTime())
    ? postDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const rawTags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()) : [];
  const cleanTags = Array.from(new Set(['remote', 'fresh-grad', ...rawTags])).slice(0, 8);

  const loc = item.location && item.location.trim().length > 0
    ? `${item.location.trim()} (Remote)`
    : 'Remote';

  const jobTypeStr = Array.isArray(item.job_types) && item.job_types.length > 0
    ? item.job_types.join(', ')
    : 'Full Time';

  return {
    id: `arb-${item.slug || Math.random().toString(36).substring(2, 9)}`,
    title: item.title ? item.title.trim() : 'Software Engineer',
    company,
    location: loc,
    level: 'Entry Level',
    type: jobTypeStr,
    source: 'Arbeitnow',
    applyMethod: 'portal',
    applyUrl: item.url || (item.slug ? `https://www.arbeitnow.com/view/${item.slug}` : 'https://www.arbeitnow.com/'),
    postedAt: formattedPostedAt,
    universalCategory: 'tech',
    tags: cleanTags
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate limiting (60 req per 60 detik)
  if (!applyRateLimit(req, res, { maxRequests: 60, windowMs: 60000 })) {
    return;
  }

  const { page = '1', limit = '50', q = '' } = req.query || {};
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const apiUrl = `https://www.arbeitnow.com/api/job-board-api?page=${pageNum}`;
    const apiRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LolosKerja/2.2.0 (Career Copilot; https://loloskerja.id)'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!apiRes.ok) {
      throw new Error(`Arbeitnow API returned HTTP ${apiRes.status}`);
    }

    const json = await apiRes.json();
    const rawItems = Array.isArray(json.data) ? json.data : [];

    const nowMs = Date.now();
    let transformedJobs = [];

    for (const raw of rawItems) {
      const processed = processArbeitnowItem(raw, nowMs);
      if (processed) {
        if (q && q.trim().length > 0) {
          const term = q.trim().toLowerCase();
          const matchesTerm = (
            processed.title.toLowerCase().includes(term) ||
            processed.company.toLowerCase().includes(term) ||
            processed.tags.some(t => t.toLowerCase().includes(term))
          );
          if (!matchesTerm) continue;
        }
        transformedJobs.push(processed);
      }
    }

    const paginated = transformedJobs.slice(0, pageSize);

    return res.status(200).json({
      success: true,
      source: 'Arbeitnow',
      page: pageNum,
      totalMatched: transformedJobs.length,
      returned: paginated.length,
      jobs: paginated,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Arbeitnow Handler Error]:', err);
    return res.status(500).json({
      error: 'Gagal mengambil data lowongan pekerjaan dari Arbeitnow.',
      details: err.message
    });
  }
}

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
}
