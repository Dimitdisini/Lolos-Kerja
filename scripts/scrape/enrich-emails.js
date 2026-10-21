/**
 * Pencarian email rekrutmen dari hasil scraping lowongan.
 *
 * Alur:
 *   data scraping (Apify)  ->  filter fresh grad  ->  kelompokkan per perusahaan
 *   -> email di deskripsi lowongan (jika ada)
 *   -> crawl website resmi perusahaan (halaman karier/kontak, patuh robots.txt)
 *   -> hanya domain yang sama dengan website, bukan email tebakan
 *   -> validasi MX  ->  data/blast-targets.json + data/blast-targets.js
 *
 * Pemakaian:
 *   node scripts/scrape/enrich-emails.js [--in file.json ...] [--limit N] [--no-network] [--refresh]
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns/promises';
import { fileURLToPath } from 'url';
import { isFreshGradEligible } from './run.js';
import {
  normalizeApifyItem, companyKey, extractEmails, pickCompanyEmails, emailsFromJobDescription,
  parseRobots, findCareerLinks, classifyRoleKeys, classifyBlastCategory, classifyEmail
} from './classify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'data');
const CACHE_FILE = path.join(__dirname, '.cache', 'site-emails.json');
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const USER_AGENT = 'LolosKerjaBot/1.0 (pencarian kontak karier publik; kontak: lamaran@loloskerja.id)';
const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 600 * 1024;
const HOST_DELAY_MS = 1200;
const CONCURRENCY = 4;
const STATIC_PATHS = ['/', '/careers', '/career', '/karir', '/contact', '/contact-us', '/kontak', '/hubungi-kami'];
const MAX_PAGES_PER_COMPANY = 7;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parseArgs(argv) {
  const args = { in: [], limit: 0, network: true, refresh: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in') args.in.push(argv[++i]);
    else if (a === '--limit') args.limit = Number(argv[++i]) || 0;
    else if (a === '--no-network') args.network = false;
    else if (a === '--refresh') args.refresh = true;
  }
  if (args.in.length === 0) {
    args.in = ['new-apify-scraped-jobs.json', 'apify-raw-jobs.json']
      .map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f));
  } else {
    args.in = args.in.map(f => path.resolve(process.cwd(), f));
  }
  return args;
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,text/plain;q=0.9,*/*;q=0.5', 'Accept-Language': 'id,en;q=0.8' },
      signal: ctrl.signal,
      redirect: 'follow'
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !/text\/|html|xml/i.test(type)) return { ok: false, status: res.status, text: '' };
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      chunks.push(value);
      if (total > MAX_BYTES) { ctrl.abort(); break; }
    }
    return { ok: true, status: res.status, text: Buffer.concat(chunks).toString('utf8'), finalUrl: res.url };
  } catch (e) {
    return { ok: false, status: 0, text: '', error: e.name };
  } finally {
    clearTimeout(timer);
  }
}

async function hasMx(domain) {
  try {
    const mx = await dns.resolveMx(domain);
    return Array.isArray(mx) && mx.length > 0;
  } catch {
    return false;
  }
}

export async function crawlCompanySite(host, { baseUrl, delayMs = HOST_DELAY_MS } = {}) {
  const base = baseUrl || ('https://' + host);
  const candidates = [];
  const visited = new Set();
  const log = { pages: 0, blocked_by_robots: 0, errors: 0 };

  const robotsRes = await fetchText(base + '/robots.txt');
  const allowed = robotsRes.ok ? parseRobots(robotsRes.text) : () => true;
  await sleep(delayMs);

  const queue = STATIC_PATHS.map(p => base + p);
  while (queue.length && log.pages < MAX_PAGES_PER_COMPANY) {
    const url = queue.shift();
    let u;
    try { u = new URL(url); } catch { continue; }
    const key = u.origin + u.pathname.replace(/\/$/, '');
    if (visited.has(key)) continue;
    visited.add(key);
    if (!allowed(u.pathname)) { log.blocked_by_robots++; continue; }

    const res = await fetchText(url);
    await sleep(delayMs);
    if (!res.ok) { if (res.status === 0) log.errors++; if (log.errors >= 2 && log.pages === 0) break; continue; }
    log.pages++;

    for (const email of extractEmails(res.text)) {
      candidates.push({ email, source_url: res.finalUrl || url });
    }
    if (u.pathname === '/' || u.pathname === '') {
      for (const link of findCareerLinks(res.text, res.finalUrl || url, 3)) queue.push(link);
    }
  }
  return { candidates, log };
}

async function runPool(items, worker, size) {
  const results = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  }));
  return results;
}

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { return {}; }
}
function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export function groupJobsByCompany(rawItems) {
  const companies = new Map();
  let total = 0, rejectedSenior = 0;
  for (const raw of rawItems) {
    const job = normalizeApifyItem(raw);
    if (!job) continue;
    total++;
    if (!isFreshGradEligible(job.title) || /mid-senior|director|executive/i.test(job.seniority)) { rejectedSenior++; continue; }
    const key = companyKey(job.company);
    if (!key) continue;
    if (!companies.has(key)) companies.set(key, { company: job.company, website: job.website, jobs: [] });
    const c = companies.get(key);
    if (!c.website && job.website) c.website = job.website;
    if (!c.jobs.some(j => j.title === job.title && j.location === job.location)) c.jobs.push(job);
  }
  return { companies: [...companies.values()], total, rejectedSenior };
}

export async function buildTargets({ rawItems, network = true, refresh = false, limit = 0, onProgress = () => {} }) {
  const { companies, total, rejectedSenior } = groupJobsByCompany(rawItems);
  const cache = loadCache();
  const now = Date.now();
  let list = companies;
  if (limit > 0) list = list.slice(0, limit);

  const report = {
    generated_at: new Date().toISOString(),
    jobs_in_input: total,
    rejected_senior: rejectedSenior,
    companies_total: list.length,
    companies_with_website: 0,
    companies_crawled: 0,
    companies_with_email: 0,
    emails_recruiting: 0,
    emails_general: 0,
    emails_job_posting: 0,
    emails_mx_failed: 0
  };

  const targets = [];

  await runPool(list, async (comp, idx) => {
    const found = [];

    // 1) Email yang ditulis di deskripsi lowongan
    for (const j of comp.jobs) {
      for (const e of emailsFromJobDescription(j.description)) {
        if (classifyEmail(e.email).kind || e.kind === 'job_posting') {
          found.push({ email: e.email, kind: 'job_posting', source: 'job_description', source_url: j.link, via_job: j.title });
        }
      }
    }

    // 2) Crawl website resmi perusahaan
    if (comp.website) {
      report.companies_with_website++;
      let siteResult = cache[comp.website];
      const fresh = siteResult && (now - siteResult.fetched_at) < CACHE_TTL_MS && !refresh;
      if (!fresh && network) {
        const { candidates, log } = await crawlCompanySite(comp.website);
        siteResult = { fetched_at: now, candidates, log };
        cache[comp.website] = siteResult;
        report.companies_crawled++;
      }
      if (siteResult) {
        for (const p of pickCompanyEmails(siteResult.candidates, comp.website, 2)) {
          found.push({ email: p.email, kind: p.kind, source: 'company_site', source_url: p.source_url });
        }
      }
    }
    onProgress(idx + 1, list.length, comp.company, found.length);

    // 3) Validasi MX dan gabungkan (job_posting diutamakan)
    const order = { job_posting: 0, recruiting: 1, general: 2 };
    found.sort((a, b) => order[a.kind] - order[b.kind]);
    const seen = new Set();
    for (const f of found) {
      if (seen.has(f.email)) continue;
      seen.add(f.email);
      const domain = f.email.split('@')[1];
      const mxOk = network ? await hasMx(domain) : true;
      if (!mxOk) { report.emails_mx_failed++; continue; }
      const roleKeys = [...new Set(comp.jobs.flatMap(j => classifyRoleKeys(j.title, j.description)))];
      targets.push({
        id: 'tgt-' + crypto.createHash('sha1').update(f.email).digest('hex').slice(0, 8),
        company: comp.company,
        website: comp.website,
        email: f.email,
        kind: f.kind,
        source: f.source,
        source_url: f.source_url || null,
        mx_valid: true,
        category: classifyBlastCategory({ title: comp.jobs[0].title, company: comp.company }),
        role_keys: roleKeys,
        jobs: comp.jobs.map(j => ({
          title: j.title,
          location: j.location,
          link: j.link,
          role_keys: classifyRoleKeys(j.title, j.description)
        }))
      });
      if (f.kind === 'recruiting') report.emails_recruiting++;
      else if (f.kind === 'general') report.emails_general++;
      else report.emails_job_posting++;
      if (targets.filter(t => t.company === comp.company).length >= 2) break;
    }
  }, CONCURRENCY);

  if (network) saveCache(cache);

  report.companies_with_email = new Set(targets.map(t => t.company)).size;
  targets.sort((a, b) => a.company.localeCompare(b.company));
  return { targets, report };
}

export function writeOutputs({ targets, report }, outDir = OUT_DIR) {
  fs.mkdirSync(outDir, { recursive: true });
  const payload = { generated_at: report.generated_at, report, targets };
  fs.writeFileSync(path.join(outDir, 'blast-targets.json'), JSON.stringify(payload, null, 2));
  // Versi .js agar bisa dimuat dari file:// tanpa fetch
  fs.writeFileSync(
    path.join(outDir, 'blast-targets.js'),
    '/* Dihasilkan otomatis oleh scripts/scrape/enrich-emails.js. Jangan diedit manual. */\n' +
    'window.BLAST_TARGETS_DATA = ' + JSON.stringify(payload) + ';\n'
  );
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.in.length === 0) {
    console.error('Tidak ada berkas input. Jalankan scraping dulu atau berikan --in file.json');
    process.exit(1);
  }
  let rawItems = [];
  for (const f of args.in) {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    rawItems = rawItems.concat(Array.isArray(j) ? j : (j.jobs || []));
    console.log('Input:', path.relative(ROOT, f), '(' + (Array.isArray(j) ? j.length : (j.jobs || []).length) + ' item)');
  }

  const result = await buildTargets({
    rawItems,
    network: args.network,
    refresh: args.refresh,
    limit: args.limit,
    onProgress: (n, total, company, found) => console.log(`[${n}/${total}] ${company}: ${found} kandidat email`)
  });

  writeOutputs(result);
  const r = result.report;
  console.log('\n=== LAPORAN ===');
  console.log(`Lowongan masuk              : ${r.jobs_in_input} (ditolak senior: ${r.rejected_senior})`);
  console.log(`Perusahaan                  : ${r.companies_total}`);
  console.log(`  punya website            : ${r.companies_with_website}`);
  console.log(`  punya email valid         : ${r.companies_with_email} (${r.companies_total ? Math.round(100 * r.companies_with_email / r.companies_total) : 0}%)`);
  console.log(`Email rekrutmen             : ${r.emails_recruiting}`);
  console.log(`Email umum (info@, dll)     : ${r.emails_general}`);
  console.log(`Email dari deskripsi loker  : ${r.emails_job_posting}`);
  console.log(`Ditolak (MX tidak valid)    : ${r.emails_mx_failed}`);
  console.log('Output: data/blast-targets.json dan data/blast-targets.js');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e); process.exit(1); });
}
