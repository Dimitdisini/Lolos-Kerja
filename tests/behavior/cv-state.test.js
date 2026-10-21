import { describe, it, expect } from 'vitest';
import { loadApp } from './helpers.js';

const OLD_DRAFT = {
  rawText: 'Memimpin dan mengoptimalkan alur Dimitri Ahmad ATS - Project Engineer bersama tim lintas fungsi yang meningkatkan efisiensi tugas sebesar 28%.',
  starText: '"Memimpin ... 99.5%"',
  targetRole: 'project-officer',
  updatedAt: '2026-10-19T08:00:00.000Z'
};

const text = (dom, id) => dom.window.document.getElementById(id)?.textContent ?? null;
const hidden = (dom, id) => dom.window.document.getElementById(id).classList.contains('hidden');

describe('Modul CV: kondisi awal tidak boleh berisi data yang belum diisi pengguna', () => {
  it('halaman baru tanpa draf: semua kosong, langkah 1', async () => {
    const dom = await loadApp();
    const doc = dom.window.document;
    expect(doc.getElementById('cvExperienceInput').value).toBe('');
    expect(text(dom, 'atsScoreValue')).toBe('0');
    expect(text(dom, 'atsBadgeStatus')).toMatch(/Belum Ada Draf/);
    expect(hidden(dom, 'cvDraftRestoreBanner')).toBe(true);
    expect(doc.getElementById('cvStepCircle-2').className).toContain('bg-slate-100');
    dom.window.close();
  });

  it('ada draf lama di localStorage: TIDAK dimuat diam-diam (masalah yang terlihat di langkah 2)', async () => {
    const dom = await loadApp({ localStorage: { lolos_kerja_cv_data: OLD_DRAFT } });
    const doc = dom.window.document;

    expect(doc.getElementById('cvExperienceInput').value).toBe('');
    expect(text(dom, 'atsScoreValue')).toBe('0');
    expect(text(dom, 'previewAfter')).not.toMatch(/Dimitri|28%|99\.5/);
    expect(text(dom, 'previewBefore')).not.toMatch(/Dimitri/);
    // langkah 2 tidak aktif
    expect(doc.getElementById('cvStepCircle-2').className).toContain('bg-slate-100');
    // pengguna diberi pilihan
    expect(hidden(dom, 'cvDraftRestoreBanner')).toBe(false);
    expect(text(dom, 'cvDraftRestoreMeta')).toMatch(/karakter/);
    dom.window.close();
  });

  it('"Lanjutkan draf" memuat teks ke kolom yang terlihat dan menghitung skor sungguhan', async () => {
    const dom = await loadApp({ localStorage: { lolos_kerja_cv_data: OLD_DRAFT } });
    const doc = dom.window.document;
    dom.window.restoreSavedCvDraft();

    expect(doc.getElementById('cvExperienceInput').value).toBe(OLD_DRAFT.rawText);
    expect(doc.getElementById('cvModeTextView').classList.contains('hidden')).toBe(false);
    expect(doc.getElementById('cvModeGrillView').classList.contains('hidden')).toBe(true);
    expect(Number(text(dom, 'atsScoreValue'))).toBeGreaterThan(0);
    expect(hidden(dom, 'cvDraftRestoreBanner')).toBe(true);
    dom.window.close();
  });

  it('"Mulai dari kosong" menghapus draf lama', async () => {
    const dom = await loadApp({ localStorage: { lolos_kerja_cv_data: OLD_DRAFT } });
    dom.window.discardSavedCvDraft();
    expect(dom.window.localStorage.getItem('lolos_kerja_cv_data')).toBeNull();
    expect(hidden(dom, 'cvDraftRestoreBanner')).toBe(true);
    expect(dom.window.document.getElementById('cvExperienceInput').value).toBe('');
    dom.window.close();
  });

  it('draf rusak atau terlalu pendek diabaikan tanpa error', async () => {
    const dom = await loadApp({ localStorage: { lolos_kerja_cv_data: '{bukan json' } });
    expect(hidden(dom, 'cvDraftRestoreBanner')).toBe(true);
    dom.window.close();
    const dom2 = await loadApp({ localStorage: { lolos_kerja_cv_data: { rawText: 'ab' } } });
    expect(hidden(dom2, 'cvDraftRestoreBanner')).toBe(true);
    dom2.window.close();
  });
});

describe('Poles STAR: tidak boleh mengarang angka atau skor', () => {
  async function polish(raw) {
    const dom = await loadApp();
    const { document: doc } = dom.window;
    doc.getElementById('cvExperienceInput').value = raw;
    dom.window.applyStarOptimization();
    return { dom, after: doc.getElementById('previewAfter').textContent, score: Number(doc.getElementById('atsScoreValue').textContent) };
  }

  it('uraian tanpa angka: tidak ada angka baru, ada penanda [ISI ...]', async () => {
    const { dom, after } = await polish('Saya membantu tim koordinasi membuat laporan mingguan dan menguji aplikasi');
    expect(after).toContain('[ISI HASIL TERUKUR');
    expect(after.replace(/\[ISI[^\]]*\]/g, '')).not.toMatch(/\d/);
    expect(after).not.toMatch(/38%|99\.5|28%|35%|40%|140%/);
    dom.window.close();
  });

  it('uraian dengan angka: angka pengguna dipertahankan, tidak ada penanda', async () => {
    const { dom, after } = await polish('Mengkoordinasikan 8 anggota tim dan memangkas waktu proses 30%');
    expect(after).toContain('8 anggota');
    expect(after).toContain('30%');
    expect(after).not.toContain('[ISI');
    dom.window.close();
  });

  it('skor berasal dari analisis isi, bukan angka tetap 98', async () => {
    const weak = await polish('membantu tim');
    expect(weak.score).toBeLessThan(80);
    const strong = await polish('Memimpin 8 anggota tim, merancang SOP, mengoptimalkan proses sehingga turun 30% dalam 3 bulan, menganalisis kebutuhan stakeholder dengan SQL dan UAT');
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.score).not.toBe(98);
    weak.dom.window.close();
    strong.dom.window.close();
  });

  it('nama preset lama (DIMAS PRATAMA dll) tidak memicu hasil jadi', async () => {
    const { dom, after } = await polish('DIMAS PRATAMA membantu administrasi kantor');
    expect(after).toContain('[ISI HASIL TERUKUR');
    expect(after).not.toMatch(/Dimas|rekonsiliasi|99/);
    dom.window.close();
  });
});
