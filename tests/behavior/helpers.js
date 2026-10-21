import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.resolve(__dirname, '../../index.html');

/**
 * Memuat index.html apa adanya di JSDOM, dengan kondisi awal yang bisa diatur:
 *  - localStorage: isi yang sudah ada sebelum halaman dibuka (misal draf CV lama)
 *  - blastTargets: pengganti data/blast-targets.js (null = berkas tidak ada)
 */
export async function loadApp({ localStorage = {}, blastTargets = null } = {}) {
  let html = fs.readFileSync(INDEX, 'utf8');
  html = html.replace(/<script src="https:\/\/cdn.tailwindcss.com"><\/script>/g, '<script>window.tailwind = { config: {} };</script>');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://lolos-kerja-seven.vercel.app/',
    beforeParse(window) {
      for (const [k, v] of Object.entries(localStorage)) {
        window.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
      window.BLAST_TARGETS_DATA = blastTargets;
      window.scrollTo = () => {};
      window.alert = () => {};
      window.confirm = () => true;
      window.prompt = () => null;
      window.open = () => null;
      window.fetch = async () => ({ ok: false, status: 0, json: async () => ({}), text: async () => '' });
      window.HTMLElement.prototype.scrollIntoView = () => {};
    }
  });

  // DOMContentLoaded dan inisialisasi halaman berjalan asinkron
  await new Promise(r => setTimeout(r, 120));
  return dom;
}

export function fixtureTargets(targets, extra = {}) {
  return {
    generated_at: '2026-10-20T10:00:00.000Z',
    report: { companies_total: 10, companies_with_email: targets.length, ...extra },
    targets
  };
}

export function makeTarget(over = {}) {
  return {
    id: 'tgt-' + Math.random().toString(16).slice(2, 10),
    company: 'Acme Indonesia',
    website: 'acme.co.id',
    email: 'career@acme.co.id',
    kind: 'recruiting',
    source: 'company_site',
    source_url: 'https://acme.co.id/career',
    mx_valid: true,
    category: 'tech',
    role_keys: ['software-eng'],
    jobs: [{ title: 'Junior Software Engineer', location: 'Jakarta', link: 'https://example.org/job/1', role_keys: ['software-eng'] }],
    ...over
  };
}

/** Teks yang benar-benar terlihat pengguna (tanpa isi <script>/<style>). */
export function visibleText(dom) {
  const clone = dom.window.document.body.cloneNode(true);
  clone.querySelectorAll('script,style,template').forEach(n => n.remove());
  return clone.textContent;
}
