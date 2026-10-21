import { describe, it, expect, beforeAll } from 'vitest';
import exportHandler from '../../api/account/export.js';
import deleteHandler from '../../api/account/delete.js';
import adminOverviewHandler from '../../api/admin/overview.js';

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

describe('M8: Account Portability, Deletion & Admin Security', () => {
  beforeAll(() => {
    process.env.RATE_LIMIT_STORE = 'memory';
  });

  describe('/api/account/export: Hak Portabilitas Data (UU PDP)', () => {
    it('menolak akses tanpa token autentikasi (401)', async () => {
      const { req, res } = createMockReqRes('GET');
      await exportHandler(req, res);
      expect(res.statusCode).toBe(401);
      expect(res.data.error.toLowerCase()).toContain('autentikasi');
    });
  });

  describe('/api/account/delete: Hak untuk Dihapus (Right to be Forgotten)', () => {
    it('menolak penghapusan tanpa token autentikasi (401)', async () => {
      const { req, res } = createMockReqRes('POST', { confirm: 'HAPUS' });
      await deleteHandler(req, res);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('/api/admin/overview: Proteksi Akses Server Role', () => {
    it('menolak akses dari pengguna tanpa session admin (401/403)', async () => {
      const { req, res } = createMockReqRes('GET');
      await adminOverviewHandler(req, res);
      expect([401, 403]).toContain(res.statusCode);
    });
  });
});
