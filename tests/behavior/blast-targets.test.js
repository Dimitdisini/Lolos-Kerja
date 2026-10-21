import { describe, it, expect } from 'vitest';
import { loadApp, fixtureTargets, makeTarget, visibleText } from './helpers.js';

const cards = (dom) => [...dom.window.document.querySelectorAll('#blastTargetsContainer input[name="blastTargetCheck"]')];
const container = (dom) => dom.window.document.getElementById('blastTargetsContainer');

describe('Auto-Blast: target HANYA dari hasil scraping', () => {
  it('tanpa data scraping: tidak ada daftar karangan, ada penjelasan jujur', async () => {
    const dom = await loadApp({ blastTargets: null });
    expect(cards(dom)).toHaveLength(0);
    expect(dom.window.document.getElementById('blastEmptyNoData')).not.toBeNull();
    expect(container(dom).textContent).toMatch(/Belum ada kontak email/);
    expect(container(dom).textContent).toMatch(/tidak pernah ditebak/);
    expect(visibleText(dom)).not.toMatch(/recruitment@astra\.co\.id|careers@telkom\.co\.id|recruitment@bca\.co\.id/);
    dom.window.close();
  });

  it('daftar lama 25 rekruter manual sudah tidak ada', async () => {
    const dom = await loadApp({ blastTargets: null });
    expect(dom.window.verifiedTier1Recruiters).toBeUndefined();
    expect(visibleText(dom)).not.toMatch(/HRD Whitelist/i);
    dom.window.close();
  });

  it('menampilkan persis target dari data, tanpa pra-centang', async () => {
    const targets = [
      makeTarget({ id: 'tgt-a', company: 'Acme', email: 'career@acme.co.id' }),
      makeTarget({ id: 'tgt-b', company: 'Beta', email: 'recruitment@beta.com', jobs: [{ title: 'Marketing Intern', location: 'Bandung', link: 'l', role_keys: ['digital-marketing'] }], role_keys: ['digital-marketing'] }),
      makeTarget({ id: 'tgt-c', company: 'Gamma', email: 'info@gamma.id', kind: 'general', jobs: [{ title: 'Staff', location: 'X', link: 'l', role_keys: [] }], role_keys: [] })
    ];
    const dom = await loadApp({ blastTargets: fixtureTargets(targets) });
    const boxes = cards(dom);
    expect(boxes.map(b => b.value).sort()).toEqual(['tgt-a', 'tgt-b', 'tgt-c']);
    expect(boxes.some(b => b.checked)).toBe(false); // tidak ada penerima yang dipilih otomatis
    const text = container(dom).textContent;
    expect(text).toContain('career@acme.co.id');
    expect(text).toContain('recruitment@beta.com');
    expect(dom.window.document.getElementById('blastTargetsCountBadge').textContent).toMatch(/^3 /);
    dom.window.close();
  });

  it('label sumber email sesuai jenisnya', async () => {
    const dom = await loadApp({
      blastTargets: fixtureTargets([
        makeTarget({ id: 'tgt-r', email: 'career@acme.co.id', kind: 'recruiting' }),
        makeTarget({ id: 'tgt-g', company: 'Umum', email: 'info@umum.id', kind: 'general' }),
        makeTarget({ id: 'tgt-j', company: 'Iklan', email: 'cv@iklan.id', kind: 'job_posting' })
      ])
    });
    const text = container(dom).textContent;
    expect(text).toContain('Email Rekrutmen');
    expect(text).toContain('Email Umum');
    expect(text).toContain('Dari Iklan Lowongan');
    dom.window.close();
  });

  it('filter rumpun posisi hanya memunculkan perusahaan yang punya lowongan relevan', async () => {
    const dom = await loadApp({
      blastTargets: fixtureTargets([
        makeTarget({ id: 'tgt-dev', company: 'DevCo', email: 'career@devco.id', role_keys: ['software-eng'] }),
        makeTarget({ id: 'tgt-mkt', company: 'MktCo', email: 'career@mktco.id', jobs: [{ title: 'Social Media Specialist', location: 'J', link: 'l', role_keys: ['digital-marketing'] }], role_keys: ['digital-marketing'] })
      ])
    });
    dom.window.applyRoleToBlastTargets('software-eng');
    expect(cards(dom).map(b => b.value)).toEqual(['tgt-dev']);
    dom.window.applyRoleToBlastTargets('digital-marketing');
    expect(cards(dom).map(b => b.value)).toEqual(['tgt-mkt']);
    dom.window.applyRoleToBlastTargets('all');
    expect(cards(dom)).toHaveLength(2);
    dom.window.close();
  });

  it('posisi tanpa kontak email: pesan kosong jujur, bukan "semua sudah dilamar"', async () => {
    const dom = await loadApp({ blastTargets: fixtureTargets([makeTarget({ id: 'tgt-dev', role_keys: ['software-eng'] })]) });
    dom.window.applyRoleToBlastTargets('finance-accounting');
    expect(cards(dom)).toHaveLength(0);
    expect(container(dom).textContent).toMatch(/Belum ada kontak email/);
    expect(container(dom).textContent).not.toMatch(/Sudah Dilamar/);
    dom.window.close();
  });

  it('data scraping berisi HTML berbahaya tidak dieksekusi (XSS)', async () => {
    const evil = makeTarget({
      id: 'tgt-evil',
      company: '<img src=x onerror="window.__pwned=1">Evil',
      jobs: [{ title: '<script>window.__pwned=2</script>Admin', location: 'J', link: 'l', role_keys: ['business-analyst'] }]
    });
    const dom = await loadApp({ blastTargets: fixtureTargets([evil]) });
    expect(container(dom).querySelector('img')).toBeNull();
    expect(container(dom).querySelector('script')).toBeNull();
    expect(dom.window.__pwned).toBeUndefined();
    expect(container(dom).textContent).toContain('Evil');
    dom.window.close();
  });

  it('pilih cepat bekerja hanya atas perintah pengguna', async () => {
    const targets = [1, 2, 3, 4].map(n => makeTarget({ id: 'tgt-' + n, company: 'P' + n, email: 'career@p' + n + '.id' }));
    const dom = await loadApp({ blastTargets: fixtureTargets(targets) });
    expect(cards(dom).filter(b => b.checked)).toHaveLength(0);
    dom.window.selectTopNBlastTargets(2);
    expect(cards(dom).filter(b => b.checked)).toHaveLength(2);
    dom.window.selectAllBlastTargets(false);
    expect(cards(dom).filter(b => b.checked)).toHaveLength(0);
    dom.window.close();
  });

  it('email tidak pernah ditebak dari nama perusahaan', async () => {
    const dom = await loadApp();
    expect(dom.window.resolveScrapedCompanyEmail('Astra International')).toBeNull();
    expect(dom.window.resolveScrapedCompanyEmail('PT Telkom Indonesia')).toBeNull();
    dom.window.close();
  });

  it('keterangan kesegaran data memakai tanggal scraping, bukan klaim "Auto-Sync"', async () => {
    const dom = await loadApp({ blastTargets: fixtureTargets([makeTarget()], { companies_with_email: 1 }) });
    const t = dom.window.document.getElementById('blastDataFreshness').textContent;
    expect(t).toMatch(/Data scraping/);
    expect(t).toMatch(/2026/);
    expect(visibleText(dom)).not.toMatch(/Auto-Sync/);
    dom.window.close();
  });
});
