import { describe, it, expect, beforeAll } from 'vitest';
import questionsHandler from '../../api/interview/questions.js';
import scoreHandler from '../../api/interview/score.js';
import { analyzeDeliveryMetrics } from '../../src/pages/interview.js';

function createMockReqRes(method = 'POST', body = {}) {
  const req = {
    method,
    body,
    headers: { 'x-forwarded-for': '127.0.0.1' },
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
    get statusCode() { return statusCode; },
    get data() { return responseData; },
    get headers() { return resHeaders; }
  };

  return { req, res };
}

describe('M6: Interview Module Endpoints & Metrics', () => {
  beforeAll(() => {
    process.env.LLM_MODE = 'fixture';
    process.env.RATE_LIMIT_STORE = 'memory';
  });

  describe('/api/interview/questions', () => {
    it('menghasilkan daftar pertanyaan wawancara dari CV dengan LLM_MODE=fixture', async () => {
      const { req, res } = createMockReqRes('POST', {
        masterProfile: {
          identity: { name: 'Dimitri Ahmad' },
          experience: [{ role: 'Project Manager IoT' }]
        },
        count: 2,
        lang: 'id'
      });

      await questionsHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.questions)).toBe(true);
      expect(res.data.questions.length).toBeGreaterThanOrEqual(1);
      expect(res.data.questions[0].question).toBeDefined();
    });
  });

  describe('/api/interview/score', () => {
    it('menolak penilaian jika jawaban terlalu pendek (< 5 karakter)', async () => {
      const { req, res } = createMockReqRes('POST', {
        question: 'Ceritakan tentang diri Anda',
        transcript: 'Ya'
      });

      await scoreHandler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.data.error).toBeDefined();
    });

    it('menilai jawaban dengan rubrik STAR dan mengembalikan skor serta model_answer', async () => {
      const { req, res } = createMockReqRes('POST', {
        question: 'Ceritakan pengalaman Anda memimpin proyek IoT?',
        transcript: 'Pada proyek telemetri ESP32, saya mengkoordinasikan 4 anggota tim dan berhasil meningkatkan kecepatan transmisi data sebesar 35%.',
        durationSeconds: 25
      });

      await scoreHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.relevance_score).toBeGreaterThan(0);
      expect(res.data.rubric).toBeDefined();
      expect(res.data.model_answer).toBeDefined();
    });
  });

  describe('analyzeDeliveryMetrics: Client-Side Delivery & WPM Audit', () => {
    it('memisahkan filler vokal murni (aaa, eee) dari kata hedging (mungkin, kayaknya)', () => {
      const spokenText = 'Saya aaa memimpin tim eee dan mungkin kayaknya hasilnya cukup baik.';
      const metrics = analyzeDeliveryMetrics(spokenText, 10);

      expect(metrics.pureFillers).toContain('aaa');
      expect(metrics.pureFillers).toContain('eee');
      expect(metrics.hedgingWords).toContain('mungkin');
      expect(metrics.hedgingWords).toContain('kayaknya');
      expect(metrics.totalFillers).toBe(4);
      expect(metrics.wpm).toBeGreaterThan(0);
    });

    it('menyembunyikan WPM (null) jika tidak ada durasi rekaman (> 0)', () => {
      const metrics = analyzeDeliveryMetrics('Jawaban teks tanpa rekaman audio', 0);
      expect(metrics.wpm).toBeNull();
    });
  });
});
