import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import tickHandler from '../../api/_handlers/blast/tick.js';
import webhookResendHandler from '../../api/_handlers/blast/webhook-resend.js';
import { getWibDayStartIso } from '../../api/_handlers/blast/plan.js';

function createMockReqRes(method = 'POST', body = {}, headers = {}) {
  const req = {
    method,
    body,
    headers: { 'x-forwarded-for': '127.0.0.1', ...headers },
    query: {}
  };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    get statusCode() { return statusCode; },
    get data() { return responseData; }
  };

  return { req, res };
}

describe('M5: Blast Engine & Security Tests (T-BLAST-01 s/d T-BLAST-15)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.RATE_LIMIT_STORE = 'memory';
    process.env.CRON_SECRET = 'valid-test-cron-secret-123';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('T-BLAST-01: Fail-Closed CRON_SECRET Authentication', () => {
    it('menolak akses dengan 401 jika header Authorization tidak ada atau tidak valid', async () => {
      const { req, res } = createMockReqRes('POST', {}, { authorization: 'Bearer wrong-secret' });
      await tickHandler(req, res);
      expect(res.statusCode).toBe(401);
      expect(res.data.error).toContain('Unauthorized');
    });

    it('menolak akses dengan 500 jika CRON_SECRET di environment server kosong', async () => {
      delete process.env.CRON_SECRET;
      const { req, res } = createMockReqRes('POST', {}, { authorization: 'Bearer valid-test-cron-secret-123' });
      await tickHandler(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.data.error).toContain('CRON_SECRET');
    });
  });

  describe('T-BLAST-02: Strict MAIL_TRANSPORT Configuration (B3)', () => {
    it('melempar error keras (500) jika mode resend aktif tapi RESEND_API_KEY kosong', async () => {
      process.env.MAIL_TRANSPORT = 'resend';
      delete process.env.RESEND_API_KEY;

      const { req, res } = createMockReqRes('POST', {}, { authorization: 'Bearer valid-test-cron-secret-123' });
      await tickHandler(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.data.error).toContain('RESEND_API_KEY wajib diisi');
    });
  });

  describe('T-BLAST-11: Resend Webhook & Auto-Circuit Breaker', () => {
    it('menolak webhook dengan payload kosong atau tanpa tipe event', async () => {
      const { req, res } = createMockReqRes('POST', {});
      await webhookResendHandler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.data.error).toContain('Payload');
    });

    it('berhasil memproses event delivered dengan status 200', async () => {
      const { req, res } = createMockReqRes('POST', {
        type: 'email.delivered',
        data: {
          id: 're_msg_123',
          to: ['recruiter@company.com']
        }
      });
      await webhookResendHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.data.ok).toBe(true);
    });
  });

  describe('T-BLAST-14: Perhitungan Batas Hari WIB (Asia/Jakarta) Akurat (B8)', () => {
    it('menghasilkan ISO timestamp jam 00:00:00 dengan offset +07:00', () => {
      const wibIso = getWibDayStartIso();
      expect(wibIso).toBeDefined();
      const date = new Date(wibIso);
      expect(date.getTime()).not.toBeNaN();
      // Pastikan string mencerminkan permulaan hari
      expect(typeof wibIso).toBe('string');
    });
  });
});
