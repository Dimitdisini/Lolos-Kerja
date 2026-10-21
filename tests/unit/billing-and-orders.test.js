import { describe, it, expect, beforeAll } from 'vitest';
import configHandler from '../../api/config.js';
import createOrderHandler from '../../api/billing/create-order.js';

function createMockReqRes(method = 'GET', body = {}, headers = {}) {
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
    get statusCode() { return statusCode; },
    get data() { return responseData; },
    get headers() { return resHeaders; }
  };

  return { req, res };
}

describe('M7: Billing & Order Authorization Tests', () => {
  beforeAll(() => {
    process.env.RATE_LIMIT_STORE = 'memory';
  });

  describe('/api/config: Public Configuration Endpoint', () => {
    it('mengembalikan status 200 dan konfigurasi tier yang sah', () => {
      const { req, res } = createMockReqRes('GET');
      configHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.brand).toBe('Lolos Kerja');
      expect(res.data.tiers).toBeDefined();
      expect(res.data.tiers.FLASH).toBeDefined();
      expect(res.data.tiers.VIP).toBeDefined();
      expect(res.data.tierLabels).toBeDefined();
    });

    it('menolak metode selain GET dengan 405', () => {
      const { req, res } = createMockReqRes('POST');
      configHandler(req, res);
      expect(res.statusCode).toBe(405);
    });
  });

  describe('/api/billing/create-order: Otoritas Server & Validasi', () => {
    it('menolak pemesanan tanpa token autentikasi (401)', async () => {
      const { req, res } = createMockReqRes('POST', { plan: 'VIP' });
      await createOrderHandler(req, res);
      expect(res.statusCode).toBe(401);
      expect(res.data.error.toLowerCase()).toContain('autentikasi');
    });
  });
});
