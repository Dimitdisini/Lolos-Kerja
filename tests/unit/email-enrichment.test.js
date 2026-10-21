import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import {
  extractEmails, classifyEmail, pickCompanyEmails, registrableDomain, sameOrganization,
  parseRobots, findCareerLinks, classifyRoleKeys, decodeCfEmail, emailsFromJobDescription,
  normalizeApifyItem, companyKey, classifyBlastCategory
} from '../../scripts/scrape/classify.js';
import { crawlCompanySite, groupJobsByCompany, buildTargets } from '../../scripts/scrape/enrich-emails.js';

describe('extractEmails', () => {
  it('membaca mailto, teks biasa, dan tidak menduplikasi', () => {
    const html = '<a href="mailto:career@acme.co.id">Kirim</a> hubungi career@acme.co.id atau hr@acme.co.id.';
    expect(extractEmails(html).sort()).toEqual(['career@acme.co.id', 'hr@acme.co.id']);
  });

  it('membaca bentuk tersamar: entitas HTML, [at], (dot)', () => {
    expect(extractEmails('talent&#64;acme.com')).toContain('talent@acme.com');
    expect(extractEmails('jobs [at] acme [dot] com')).toContain('jobs@acme.com');
  });

  it('membaca email terproteksi Cloudflare', () => {
    // "hr@acme.id" dienkode dengan kunci 0x42
    const key = 0x42;
    const enc = 'hr@acme.id'.split('').map(c => (c.charCodeAt(0) ^ key).toString(16).padStart(2, '0')).join('');
    const hex = key.toString(16).padStart(2, '0') + enc;
    expect(decodeCfEmail(hex)).toBe('hr@acme.id');
    expect(extractEmails(`<a class="__cf_email__" data-cfemail="${hex}">[email&#160;protected]</a>`)).toContain('hr@acme.id');
  });

  it('tidak salah mengira nama file gambar sebagai email', () => {
    expect(extractEmails('<img src="logo@2x.png"> <img src="hero@3x.jpg">')).toEqual([]);
  });
});

describe('classifyEmail', () => {
  it.each([
    ['career@acme.co.id', 'recruiting'],
    ['karir@acme.co.id', 'recruiting'],
    ['recruitment@acme.com', 'recruiting'],
    ['talent.acquisition@acme.com', 'recruiting'],
    ['hrd@acme.com', 'recruiting'],
    ['hr@acme.com', 'recruiting'],
    ['info@acme.com', 'general'],
    ['hello@acme.com', 'general'],
    ['contact@acme.com', 'general']
  ])('%s -> %s', (email, kind) => {
    expect(classifyEmail(email).kind).toBe(kind);
  });

  it.each([
    'noreply@acme.com', 'no-reply@acme.com', 'privacy@acme.com', 'legal@acme.com', 'press@acme.com',
    'sales@acme.com', 'support@acme.com', 'billing@acme.com', 'john.doe@acme.com'
  ])('menolak %s', (email) => {
    expect(classifyEmail(email).kind).toBeNull();
  });
});

describe('domain organisasi', () => {
  it('menangani domain bertingkat (.co.id) dan subdomain', () => {
    expect(registrableDomain('mail.acme.co.id')).toBe('acme.co.id');
    expect(registrableDomain('careers.acme.com')).toBe('acme.com');
    expect(sameOrganization('acme.co.id', 'www.acme.co.id'.replace('www.', ''))).toBe(true);
    expect(sameOrganization('gmail.com', 'acme.co.id')).toBe(false);
  });
});

describe('pickCompanyEmails (tidak boleh menebak, hanya domain sendiri)', () => {
  const cands = [
    { email: 'info@acme.co.id', source_url: 'https://acme.co.id/contact' },
    { email: 'career@acme.co.id', source_url: 'https://acme.co.id/career' },
    { email: 'partner@pihaklain.com', source_url: 'https://acme.co.id/' },
    { email: 'support@acme.co.id', source_url: 'https://acme.co.id/' },
    { email: 'hr@gmail.com', source_url: 'https://acme.co.id/' }
  ];

  it('mengutamakan rekrutmen, membuang domain lain dan alamat terlarang', () => {
    const picked = pickCompanyEmails(cands, 'acme.co.id', 5);
    expect(picked.map(p => p.email)).toEqual(['career@acme.co.id', 'info@acme.co.id']);
    expect(picked[0].kind).toBe('recruiting');
    expect(picked[0].source_url).toBe('https://acme.co.id/career');
  });

  it('menghormati batas jumlah', () => {
    expect(pickCompanyEmails(cands, 'acme.co.id', 1)).toHaveLength(1);
  });

  it('hasil kosong jika tidak ada kandidat sah', () => {
    expect(pickCompanyEmails([{ email: 'x@lain.com' }], 'acme.co.id')).toEqual([]);
  });
});

describe('emailsFromJobDescription', () => {
  it('mengambil email di deskripsi dan menandainya job_posting', () => {
    const r = emailsFromJobDescription('Kirim CV ke lamaran@startup.id sebelum 30 November. Jangan hubungi noreply@startup.id');
    expect(r).toEqual([{ email: 'lamaran@startup.id', kind: 'job_posting' }]);
  });
});

describe('robots.txt', () => {
  const allowed = parseRobots('User-agent: *\nDisallow: /private\nAllow: /private/public\n# komentar\nUser-agent: Googlebot\nDisallow: /');
  it('mematuhi Disallow untuk user-agent *', () => {
    expect(allowed('/careers')).toBe(true);
    expect(allowed('/private/data')).toBe(false);
    expect(allowed('/private/public/x')).toBe(true);
  });
  it('tanpa aturan = boleh', () => {
    expect(parseRobots('')('/apa-saja')).toBe(true);
  });
});

describe('findCareerLinks', () => {
  it('hanya mengambil tautan karier/kontak di domain yang sama', () => {
    const html = `
      <a href="/karir">Karir</a>
      <a href="https://acme.co.id/contact-us">Kontak</a>
      <a href="https://sosial.com/careers">Luar</a>
      <a href="/produk">Produk</a>
      <a href="/files/career.pdf">PDF</a>`;
    expect(findCareerLinks(html, 'https://acme.co.id/')).toEqual(['https://acme.co.id/karir', 'https://acme.co.id/contact-us']);
  });
});

describe('klasifikasi rumpun posisi', () => {
  it.each([
    ['Junior Software Engineer', 'software-eng'],
    ['Digital Marketing Executive', 'digital-marketing'],
    ['Accounting Staff', 'finance-accounting'],
    ['Management Trainee Operations', 'operations-trainee'],
    ['Business Analyst', 'business-analyst']
  ])('%s -> %s', (title, key) => {
    expect(classifyRoleKeys(title)).toContain(key);
  });

  it('kategori chip blast', () => {
    expect(classifyBlastCategory({ title: 'Teller', company: 'Bank Mandiri' })).toBe('bumn_bank');
    expect(classifyBlastCategory({ title: 'Store Supervisor', company: 'Fore Coffee' })).toBe('fmcg_corp');
    expect(classifyBlastCategory({ title: 'Developer', company: 'Startup X' })).toBe('tech');
  });
});

describe('pengelompokan loker', () => {
  const raw = [
    { title: 'Supervisor Store', companyName: 'Fore Coffee', companyWebsite: 'https://fore.coffee/', link: 'a', seniorityLevel: 'Entry level' },
    { title: 'Barista', companyName: 'Fore Coffee', companyWebsite: 'https://fore.coffee/', link: 'b', seniorityLevel: 'Entry level' },
    { title: 'Head of Risk Management', companyName: 'Bank Neo', companyWebsite: 'https://bankneo.co.id', link: 'c' },
    { title: 'Business Development Manager', companyName: 'Meratus', companyWebsite: 'meratus.com', link: 'd', seniorityLevel: 'Mid-Senior level' },
    { title: '', companyName: 'Kosong', link: 'e' }
  ];

  it('membuang posisi senior, mengelompokkan per perusahaan, menormalkan website', () => {
    const { companies, total, rejectedSenior } = groupJobsByCompany(raw);
    expect(total).toBe(4);
    expect(rejectedSenior).toBe(2);
    expect(companies).toHaveLength(1);
    expect(companies[0].company).toBe('Fore Coffee');
    expect(companies[0].website).toBe('fore.coffee');
    expect(companies[0].jobs).toHaveLength(2);
  });

  it('normalizeApifyItem dan companyKey', () => {
    expect(normalizeApifyItem({ title: 'X', companyName: 'Y', companyWebsite: 'http://www.y.com/' }).website).toBe('y.com');
    expect(normalizeApifyItem({ title: '', companyName: 'Y' })).toBeNull();
    expect(companyKey('PT Astra International Tbk')).toBe(companyKey('Astra International'));
  });
});

describe('buildTargets tanpa jaringan', () => {
  it('memakai email dari deskripsi lowongan dan tidak mengarang yang lain', async () => {
    const { targets, report } = await buildTargets({
      network: false,
      rawItems: [
        { title: 'Admin Staff', companyName: 'Toko Maju', companyWebsite: '', link: 'x', descriptionText: 'Kirim lamaran ke lamaran@tokomaju.id' },
        { title: 'Admin Staff', companyName: 'Tanpa Email', companyWebsite: '', link: 'y', descriptionText: 'Daftar lewat portal.' }
      ]
    });
    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({ company: 'Toko Maju', email: 'lamaran@tokomaju.id', kind: 'job_posting', source: 'job_description' });
    expect(report.companies_total).toBe(2);
    expect(report.companies_with_email).toBe(1);
  });
});

describe('crawlCompanySite pada server lokal', () => {
  let server, base;
  const hits = [];
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      hits.push(req.url);
      const send = (code, type, body) => { res.writeHead(code, { 'Content-Type': type }); res.end(body); };
      if (req.url === '/robots.txt') return send(200, 'text/plain', 'User-agent: *\nDisallow: /contact');
      if (req.url === '/') return send(200, 'text/html', '<a href="/lowongan-kerja">Lowongan</a><p>info@acme.co.id</p>');
      if (req.url === '/careers') return send(200, 'text/html', '<a href="mailto:karir@acme.co.id">Kirim CV</a>');
      if (req.url === '/lowongan-kerja') return send(200, 'text/html', 'rekrutmen@acme.co.id');
      if (req.url === '/contact') return send(200, 'text/html', 'rahasia@acme.co.id');
      return send(404, 'text/plain', 'tidak ada');
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = 'http://127.0.0.1:' + server.address().port;
  });
  afterAll(() => new Promise(r => server.close(r)));

  it('mengambil email dari halaman karier, mengikuti tautan, dan mematuhi robots.txt', async () => {
    const { candidates, log } = await crawlCompanySite('acme.co.id', { baseUrl: base, delayMs: 0 });
    const emails = candidates.map(c => c.email);
    expect(emails).toContain('karir@acme.co.id');
    expect(emails).toContain('rekrutmen@acme.co.id');
    expect(emails).not.toContain('rahasia@acme.co.id');
    expect(hits).not.toContain('/contact');
    expect(log.blocked_by_robots).toBeGreaterThanOrEqual(1);

    const picked = pickCompanyEmails(candidates, 'acme.co.id', 2).map(p => p.email);
    expect(picked.every(e => e.endsWith('@acme.co.id'))).toBe(true);
    expect(picked[0]).toMatch(/karir|rekrutmen/);
  });
});
