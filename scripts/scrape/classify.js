/**
 * Fungsi murni (tanpa jaringan) untuk pipeline pencarian email rekrutmen.
 * Dipisah dari enrich-emails.js supaya bisa diuji unit.
 */

const MULTI_PART_TLDS = new Set([
  'co.id', 'or.id', 'go.id', 'ac.id', 'sch.id', 'web.id', 'my.id', 'biz.id',
  'co.uk', 'com.au', 'com.sg', 'com.my', 'co.jp', 'co.kr', 'com.cn', 'co.nz'
]);

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}/g;

// Awalan alamat yang menandakan jalur rekrutmen
const RECRUITING_RE = /(career|karir|karier|recruit|rekrut|talent|hiring|hire|jobs?|lowongan|lamaran|vacanc|employment|apply|\bhr\b|^hr|hrd|people|humancapital|human\.capital|hcm|ta\.|internship|magang)/i;
// Alamat umum yang masih wajar menerima lamaran
const GENERAL_RE = /^(info|contact|contactus|hello|halo|hi|office|admin|mail|enquiry|enquiries|general)(\.[a-z]{2})?$/i;
// Alamat yang tidak boleh dipakai sama sekali
const REJECT_RE = /(no-?reply|do-?not-?reply|mailer-daemon|postmaster|abuse|privacy|legal|security|press|media|pr@|billing|invoice|finance|sales|support|cs@|help|complain|whistle|compliance|webmaster|noc|sentry|wixpress|example|test@|spam|unsubscribe)/i;
const IMAGE_SUFFIX_RE = /\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?)$/i;

export function normalizeHost(urlOrHost) {
  if (!urlOrHost) return null;
  let s = String(urlOrHost).trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(s)) s = 'https://' + s;
  try {
    return new URL(s).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Domain induk (registrable) sederhana: a.b.co.id -> b.co.id, x.y.com -> y.com */
export function registrableDomain(host) {
  if (!host) return null;
  const parts = host.toLowerCase().split('.');
  if (parts.length <= 2) return host.toLowerCase();
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_TLDS.has(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

export function sameOrganization(emailDomain, siteHost) {
  if (!emailDomain || !siteHost) return false;
  return registrableDomain(emailDomain) === registrableDomain(siteHost);
}

/** Decode proteksi email Cloudflare (data-cfemail) */
export function decodeCfEmail(hex) {
  try {
    const key = parseInt(hex.slice(0, 2), 16);
    let out = '';
    for (let i = 2; i < hex.length; i += 2) {
      out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
    }
    return out;
  } catch {
    return '';
  }
}

/** Ambil semua kandidat email dari HTML/teks (mailto, teks biasa, [at], entitas, Cloudflare) */
export function extractEmails(html) {
  if (!html) return [];
  let text = String(html);

  const found = new Set();

  for (const m of text.matchAll(/data-cfemail=["']([0-9a-f]+)["']/gi)) {
    const dec = decodeCfEmail(m[1]);
    if (dec.includes('@')) found.add(dec.toLowerCase());
  }

  text = text
    .replace(/&#0*64;|&commat;|&#x0*40;/gi, '@')
    .replace(/&#0*46;|&#x0*2e;/gi, '.')
    .replace(/%40/g, '@')
    .replace(/\s*[\[(]\s*at\s*[\])]\s*/gi, '@')
    .replace(/\s*[\[(]\s*dot\s*[\])]\s*/gi, '.');

  for (const m of text.matchAll(EMAIL_RE)) {
    found.add(m[0].toLowerCase());
  }

  return [...found]
    .map(e => e.replace(/^[._%+-]+/, '').replace(/[.,;:)>\]]+$/, ''))
    .filter(e => e.includes('@') && !IMAGE_SUFFIX_RE.test(e) && e.length <= 80);
}

/**
 * Klasifikasi satu alamat email.
 * Kembalikan { kind: 'recruiting' | 'general' | null, reason }
 */
export function classifyEmail(email) {
  if (!email || !email.includes('@')) return { kind: null, reason: 'format' };
  const [local] = email.toLowerCase().split('@');
  if (REJECT_RE.test(email.toLowerCase())) return { kind: null, reason: 'reject' };
  if (RECRUITING_RE.test(local)) return { kind: 'recruiting', reason: 'recruiting-keyword' };
  if (GENERAL_RE.test(local)) return { kind: 'general', reason: 'general-inbox' };
  return { kind: null, reason: 'unknown-local-part' };
}

/**
 * Pilih email terbaik dari hasil crawl satu perusahaan.
 * - hanya domain organisasi yang sama dengan website
 * - recruiting diutamakan, maksimal `max` alamat
 */
export function pickCompanyEmails(candidates, siteHost, max = 2) {
  const seen = new Set();
  const out = [];
  for (const c of candidates) {
    const email = (c.email || '').toLowerCase();
    if (!email || seen.has(email)) continue;
    const domain = email.split('@')[1];
    if (!sameOrganization(domain, siteHost)) continue;
    const { kind } = classifyEmail(email);
    if (!kind) continue;
    seen.add(email);
    out.push({ email, kind, source_url: c.source_url || null });
  }
  out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'recruiting' ? -1 : 1));
  return out.slice(0, max);
}

/** Email yang tertulis langsung di deskripsi lowongan (domain boleh bebas). */
export function emailsFromJobDescription(text) {
  return extractEmails(text)
    .filter(e => !REJECT_RE.test(e))
    .map(e => ({ email: e, kind: 'job_posting' }));
}

/** robots.txt: kembalikan fungsi allowed(path) untuk user-agent '*' */
export function parseRobots(txt) {
  const disallow = [];
  const allow = [];
  let applies = false;
  for (const raw of String(txt || '').split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      applies = val === '*';
    } else if (applies && key === 'disallow' && val) {
      disallow.push(val);
    } else if (applies && key === 'allow' && val) {
      allow.push(val);
    }
  }
  return function allowed(pathname) {
    const p = pathname || '/';
    const longestAllow = allow.filter(a => p.startsWith(a)).sort((a, b) => b.length - a.length)[0];
    const longestDisallow = disallow.filter(d => p.startsWith(d)).sort((a, b) => b.length - a.length)[0];
    if (!longestDisallow) return true;
    if (longestAllow && longestAllow.length >= longestDisallow.length) return true;
    return false;
  };
}

/** Tautan internal di halaman yang mengarah ke karier/kontak (maks `max`). */
export function findCareerLinks(html, baseUrl, max = 3) {
  const out = [];
  const seen = new Set();
  let base;
  try { base = new URL(baseUrl); } catch { return out; }
  for (const m of String(html || '').matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
    let u;
    try { u = new URL(m[1], base); } catch { continue; }
    if (!/^https?:$/.test(u.protocol)) continue;
    if (registrableDomain(u.hostname.replace(/^www\./, '')) !== registrableDomain(base.hostname.replace(/^www\./, ''))) continue;
    if (!/(career|karir|karier|lowongan|join|bergabung|recruit|contact|kontak|hubungi)/i.test(u.pathname)) continue;
    if (/\.(pdf|png|jpe?g|zip)$/i.test(u.pathname)) continue;
    const key = u.origin + u.pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u.toString());
    if (out.length >= max) break;
  }
  return out;
}

/** Klasifikasi rumpun posisi sesuai pilihan di Auto-Blast */
export function classifyRoleKeys(title, description = '') {
  const t = String(title || '').toLowerCase();
  const d = String(description || '').toLowerCase().slice(0, 600);
  const keys = [];
  const test = (re) => re.test(t) || (t.length < 12 && re.test(d));

  if (/(software|developer|programmer|engineer(?!.*(civil|sipil|mechanical|mesin))|frontend|front-end|backend|back-end|fullstack|full stack|devops|qa\b|quality assurance|tester|data scientist|data engineer|machine learning|\bai\b|prompt|mobile|android|ios|web)/i.test(t)) keys.push('software-eng');
  if (/(marketing|digital|social media|content|brand|seo|sem\b|growth|copywrit|community|campaign|creative|influencer|public relation|\bpr\b)/i.test(t)) keys.push('digital-marketing');
  if (/(finance|financial|accounting|accountant|akuntan|tax|pajak|audit|treasury|credit|kredit|bank|invest|risk|payroll|billing)/i.test(t)) keys.push('finance-accounting');
  if (/(trainee|management trainee|\bmt\b|odp|operation|operasional|supply|logistic|logistik|warehouse|gudang|procurement|purchasing|production|produksi|store|outlet|supervisor|admin|general|hr\b|human resource|people|recruit|talent)/i.test(t)) keys.push('operations-trainee');
  if (/(analyst|analis|business|product|project|pmo|consultant|konsultan|strategy|strategi|coordinator|koordinator|officer|executive|associate|specialist|development)/i.test(t) || keys.length === 0 && test(/analyst|business/)) keys.push('business-analyst');

  return [...new Set(keys)];
}

/** Kategori filter chip Auto-Blast: tech | bumn_bank | fmcg_corp */
export function classifyBlastCategory(job) {
  const t = String(job.title || '').toLowerCase();
  const comp = String(job.company || '').toLowerCase();
  if (/bank|bumn|mandiri|bca|bri|bni|btn|pln|pertamina|telkom|insurance|asuransi|finance|leasing|sekuritas/i.test(comp) || /finance|akuntan|pajak|tax|audit/i.test(t)) return 'bumn_bank';
  if (/fmcg|food|beverage|retail|coffee|kopi|resto|hotel|hyatt|mart|store|unilever|nestle|danone|indofood|paragon|kalbe|logistic|shipping|group/i.test(comp) || /ops|operas|supply|logist|distrib|store|outlet/i.test(t)) return 'fmcg_corp';
  return 'tech';
}

/** Normalisasi satu item Apify mentah menjadi pekerjaan siap-enrich */
export function normalizeApifyItem(raw) {
  const title = (raw.title || '').trim();
  const company = (raw.companyName || raw.company || '').trim();
  if (!title || !company) return null;
  return {
    title,
    company,
    location: (raw.location || '').trim(),
    link: raw.link || raw.url || '',
    website: normalizeHost(raw.companyWebsite || raw.website || ''),
    seniority: raw.seniorityLevel || '',
    description: raw.descriptionText || raw.description || ''
  };
}

/** Kelompokkan pekerjaan per perusahaan (kunci = nama ternormalisasi) */
export function companyKey(name) {
  return String(name || '').toLowerCase()
    .replace(/^pt\.?\s+/i, '')
    .replace(/\s+(tbk|persero|indonesia|group|international)\b\.?/gi, '')
    .replace(/[^a-z0-9]/g, '');
}
