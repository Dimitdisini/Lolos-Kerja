import { describe, it, expect, beforeAll } from 'vitest';
import extractHandler from '../../api/_handlers/cv/extract.js';
import analyzeHandler from '../../api/_handlers/cv/analyze.js';
import rewriteHandler from '../../api/_handlers/cv/rewrite.js';
import exportPdfHandler from '../../api/_handlers/cv/export-pdf.js';
import saveHandler from '../../api/_handlers/cv/save.js';

function createMockReqRes(method = 'POST', body = {}, headers = {}) {
  const req = {
    method,
    body,
    headers: { 'x-forwarded-for': '127.0.0.1', ...headers },
    query: {}
  };
  let statusCode = 200;
  let responseData = null;
  const resHeaders = {};

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    setHeader(key, val) {
      resHeaders[key] = val;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    send(buffer) {
      responseData = buffer;
      return res;
    },
    get statusCode() { return statusCode; },
    get data() { return responseData; },
    get headers() { return resHeaders; }
  };

  return { req, res };
}

describe('M3: CV Endpoints & Pipeline (extract, analyze, rewrite, export-pdf, save)', () => {
  beforeAll(() => {
    process.env.LLM_MODE = 'fixture';
    process.env.RATE_LIMIT_STORE = 'memory';
  });

  describe('/api/cv/extract', () => {
    it('ekstraksi plain text menghasilkan charCount dan wordCount yang tepat', async () => {
      const sampleText = 'Dimitri Ahmad. Project Manager IoT. Berpengalaman memimpin tim 5 orang.';
      const { req, res } = createMockReqRes('POST', {
        content: sampleText,
        filename: 'resume.txt',
        mimeType: 'text/plain'
      });

      await extractHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.rawText).toBe(sampleText);
      expect(res.data.charCount).toBe(sampleText.length);
      expect(res.data.needsOcr).toBe(false);
    });

    it('mendeteksi dokumen scan/gambar dan menyetel needsOcr: true jika teks kosong', async () => {
      // Simulasikan PDF stream biner (scanned bitmap) berukuran > 500 byte tanpa teks kamus
      const scannedFakePdf = '%PDF-1.4 stream\n' + '\x00\x12\x8f\xaa\xbb\xcc\xdd\xee\xff'.repeat(80) + '\nendstream';
      const { req, res } = createMockReqRes('POST', {
        content: scannedFakePdf,
        filename: 'scan-cv.pdf',
        mimeType: 'application/pdf'
      });

      await extractHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.data.needsOcr).toBe(true);
    });
  });

  describe('/api/cv/analyze', () => {
    it('menolak teks CV yang terlalu pendek (< 50 karakter)', async () => {
      const { req, res } = createMockReqRes('POST', {
        rawText: 'Pendek banget',
        targetRole: 'Data Analyst'
      });

      await analyzeHandler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.data.error).toContain('terlalu pendek');
    });

    it('berhasil memproses CV dengan LLM_MODE=fixture dan mengembalikan masterProfile serta atsScore', async () => {
      const sampleCv = `Dimitri Ahmad | dimitriahmad000@gmail.com | 081234567890 | Bandung
Pendidikan: S1 Teknik Fisika Telkom University, IPK 3.69
Pengalaman: Lead Architect & Project Manager IoT.
Mendesain sistem monitoring telemetri sensor lingkungan dengan ESP32 dan MQTT.
Berhasil meningkatkan efisiensi pembacaan data hingga 34% pada 12 unit perangkat.
Keahlian: Python, C++, Docker, Supabase, PostgreSQL.`;

      const { req, res } = createMockReqRes('POST', {
        rawText: sampleCv,
        targetRole: 'Project Manager'
      });

      await analyzeHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.atsScore).toBeGreaterThanOrEqual(0);
      expect(res.data.masterProfile).toBeDefined();
      expect(res.data.report).toBeDefined();
    });
  });

  describe('/api/cv/rewrite', () => {
    it('menolak bullet kosong atau terlalu pendek', async () => {
      const { req, res } = createMockReqRes('POST', {
        bulletText: 'abc',
        targetRole: 'Backend Engineer'
      });

      await rewriteHandler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.data.error).toBeDefined();
    });

    it('memoles poin pengalaman dan mengembalikan properti items', async () => {
      const { req, res } = createMockReqRes('POST', {
        bulletText: 'Membuat modul telemetri IoT ESP32 untuk monitoring sensor cuaca',
        targetRole: 'Hardware Engineer'
      });

      await rewriteHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.suggested).toBeDefined();
      expect(res.data.items).toBeDefined();
      expect(res.data.items.length).toBe(1);
    });
  });

  describe('/api/cv/export-pdf', () => {
    it('menghasilkan file PDF Harvard ATS 1-kolom binary dengan header %PDF', async () => {
      const mockProfile = {
        identity: {
          name: 'Dimitri Ahmad',
          email: 'dimitriahmad000@gmail.com',
          phone: '081234567890',
          city: 'Bandung'
        },
        summary: 'Project Manager & System Architect berpengalaman membangun produk IoT.',
        education: [
          { school: 'Telkom University', degree: 'S1', major: 'Teknik Fisika', gpa: '3.69', start: '2019', end: '2023' }
        ],
        experience: [
          {
            org: 'Fleek Group',
            role: 'Lead Architect',
            start: '2023',
            end: '2026',
            bullets: [
              'Memimpin arsitektur multi-agent sistem berbasis Docker dan PostgreSQL.',
              'Mengoptimasi waktu latensi response model hingga 42%.'
            ]
          }
        ],
        skills: {
          technical: ['IoT', 'System Architecture', 'Node.js', 'PostgreSQL'],
          tools: ['Docker', 'Git', 'Vercel'],
          soft: ['Problem Solving', 'Leadership'],
          languages: ['Bahasa Indonesia', 'English']
        }
      };

      const { req, res } = createMockReqRes('POST', { masterProfile: mockProfile });
      await exportPdfHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toBe('application/pdf');
      const buffer = res.data;
      expect(buffer).toBeDefined();
      // Validasi header signature PDF "%PDF"
      const signature = buffer.slice(0, 4).toString('utf-8');
      expect(signature).toBe('%PDF');
    });

    it('dapat mengembalikan JSON payload jika returnJson disetujui', async () => {
      const mockProfile = {
        identity: { name: 'Alif Yusfan', email: 'alif@fleekgroup.id' },
        summary: 'Account Executive.'
      };

      const { req, res } = createMockReqRes('POST', {
        masterProfile: mockProfile,
        returnJson: true
      });
      await exportPdfHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.base64).toBeDefined();
      expect(res.data.pages).toBeGreaterThanOrEqual(1);
    });
  });

  describe('/api/cv/save', () => {
    it('menolak penyimpanan jika masterProfile tidak disertakan', async () => {
      const { req, res } = createMockReqRes('POST', {});
      await saveHandler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.data.error).toContain('masterProfile');
    });

    it('menerima penyimpanan masterProfile yang terstruktur', async () => {
      const { req, res } = createMockReqRes('POST', {
        masterProfile: {
          identity: { name: 'Dimitri Ahmad' },
          target_roles: ['Project Manager']
        },
        targetRole: 'Project Manager'
      });
      await saveHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.version).toBeDefined();
    });
  });
});
