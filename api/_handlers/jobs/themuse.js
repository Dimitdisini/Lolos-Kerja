/**
 * /api/jobs/themuse.js: The Muse Job Board & Company Culture Data Ingestor
 * Fetches fresh entry-level listings and rich employer profile data from The Muse public API
 * Docs: https://www.themuse.com/developers/api/v2
 * Node.js ESM Vercel Serverless Function
 */

import { applyRateLimit } from '../../_lib/rateLimit.js';

// Anti-penipuan: kata kunci iklan berbayar, skema komisi, biaya pendaftaran, atau MLM
const SCAM_REGEX = /\b(invest|investasi|commission only|mlm|training fee|biaya pelatihan|bayar|investasi awal|join fee|uang muka|pay to work)\b/i;

/**
 * Memetakan kategori The Muse ke universalCategory Lolos Kerja
 * @param {Array<object>} categories
 * @param {string} title
 * @returns {string}
 */
function resolveUniversalCategory(categories = [], title = '') {
  const catNames = categories.map(c => (c.name || '').toLowerCase()).join(' ');
  const titleLower = title.toLowerCase();
  const combined = `${catNames} ${titleLower}`;

  if (/software|data|computer|it|tech|engineering|developer|programming|cyber|ai|cloud/i.test(combined)) {
    return 'tech';
  }
  if (/finance|accounting|banking|investment|analyst|audit/i.test(combined)) {
    return 'finance-banking';
  }
  if (/marketing|media|creative|design|ui|ux|copywriter|content/i.test(combined)) {
    return 'creative-media';
  }
  if (/human resources|hr|recruiting|people|talent/i.test(combined)) {
    return 'hr-people';
  }
  if (/sales|business development|account executive|b2b/i.test(combined)) {
    return 'commercial-b2b';
  }
  return 'business-operations';
}

/**
 * Validasi dan pembersihan satu item dari The Muse
 * @param {object} item
 * @param {number} nowMs
 * @returns {object|null}
 */
function processTheMuseItem(item, nowMs) {
  if (!item || typeof item !== 'object') return null;

  // 1. Validation Gate: Perusahaan harus ada dan valid
  const companyObj = item.company;
  const companyName = (companyObj?.name || '').trim();
  if (!companyName || companyName.length < 2 || /^(confidential|unknown|n\/a|anonymous|personal)$/i.test(companyName)) {
    return null;
  }

  // 2. Validation Gate: Batas kedaluwarsa 30 hari (publication_date ISO 8601)
  const rawDate = item.publication_date;
  if (!rawDate) return null;
  const publishedMs = new Date(rawDate).getTime();
  const ageInDays = (nowMs - publishedMs) / (1000 * 60 * 60 * 24);
  if (isNaN(ageInDays) || ageInDays > 30 || ageInDays < -1) {
    return null; // Skip lowongan yang lebih dari 30 hari
  }

  // 3. Validation Gate: Anti-penipuan & skema berbayar
  const textContent = `${item.name || ''} ${item.contents || ''}`;
  if (SCAM_REGEX.test(textContent)) {
    return null;
  }

  // 4. Transformasi format data
  const postDate = new Date(publishedMs);
  const formattedPostedAt = !isNaN(postDate.getTime())
    ? postDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const rawLocations = Array.isArray(item.locations)
    ? item.locations.map(l => l.name).filter(Boolean)
    : [];
  const locationStr = rawLocations.length > 0 ? rawLocations.join(', ') : 'Flexible / Remote';

  const rawLevels = Array.isArray(item.levels)
    ? item.levels.map(l => l.name).filter(Boolean)
    : [];
  const levelStr = rawLevels.length > 0 ? rawLevels.join(', ') : 'Entry Level';

  const rawCategories = Array.isArray(item.categories) ? item.categories : [];
  const catTags = rawCategories.map(c => String(c.name || '').toLowerCase()).filter(Boolean);
  const cleanTags = Array.from(new Set(['the-muse', 'fresh-grad', ...catTags])).slice(0, 8);

  const universalCat = resolveUniversalCategory(rawCategories, item.name || '');

  const applyUrl = item.refs?.landing_page || `https://www.themuse.com/jobs/${item.short_name || item.id}`;

  return {
    id: `muse-${item.id || item.short_name || Math.random().toString(36).substring(2, 9)}`,
    title: item.name ? item.name.trim() : 'Entry Level Specialist',
    company: companyName,
    location: locationStr,
    level: levelStr,
    type: item.type || 'Full Time',
    source: 'The Muse',
    applyMethod: 'portal',
    applyUrl,
    postedAt: formattedPostedAt,
    universalCategory: universalCat,
    tags: cleanTags,
    companyCulture: {
      companyId: companyObj.id || null,
      shortName: companyObj.short_name || null,
      landingPage: companyObj.refs?.landing_page || null
    }
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

  const { page = '0', level = 'Entry Level', q = '' } = req.query || {};
  const pageNum = Math.max(0, parseInt(page, 10) || 0);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const queryParams = new URLSearchParams({
      page: String(pageNum),
      level: level
    });

    const apiUrl = `https://www.themuse.com/api/public/jobs?${queryParams.toString()}`;
    const apiRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LolosKerja/2.2.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!apiRes.ok) {
      throw new Error(`The Muse API returned HTTP ${apiRes.status}`);
    }

    const json = await apiRes.json();
    const rawItems = Array.isArray(json.results) ? json.results : [];

    const nowMs = Date.now();
    let transformedJobs = [];

    for (const raw of rawItems) {
      const processed = processTheMuseItem(raw, nowMs);
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

    return res.status(200).json({
      success: true,
      source: 'The Muse',
      page: pageNum,
      pageCount: json.page_count || 1,
      totalReturned: transformedJobs.length,
      jobs: transformedJobs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[The Muse Handler Error]:', err);
    return res.status(500).json({
      error: 'Gagal mengambil data lowongan dan kultur perusahaan dari The Muse.',
      details: err.message
    });
  }
}

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
}
