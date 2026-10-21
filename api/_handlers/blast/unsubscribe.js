/**
 * /api/blast/unsubscribe.js: RFC 8058 & CAN-SPAM / UU PDP Compliant Unsubscribe Endpoint
 * Automatically registers recruiter email or domain to email_blocklist
 * Node.js ESM Vercel Serverless Function
 */

import { createClient } from '@supabase/supabase-js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Support both GET (link click) and POST (One-Click Unsubscribe RFC 8058)
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30, windowMs: 60000 })) {
    return;
  }

  const email = (req.method === 'GET' ? req.query.email : req.body?.email || req.query.email)?.trim();

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Parameter email tidak valid atau kosong.' });
  }

  try {
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Upsert to email_blocklist
      await supabase
        .from('email_blocklist')
        .upsert(
          {
            email_or_domain: email.toLowerCase(),
            reason: 'Recruiter unsubscribed via link or RFC 8058 header',
            created_at: new Date().toISOString()
          },
          { onConflict: 'email_or_domain' }
        );
    }

    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Berhenti Berlangganan | Lolos Kerja</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; }
            .icon { width: 48px; height: 48px; background: #ecfdf5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; }
            h1 { font-size: 1.25rem; font-weight: 700; margin: 0 0 8px; color: #0f172a; }
            p { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin: 0 0 20px; }
            .email-badge { background: #f1f5f9; padding: 6px 12px; border-radius: 8px; font-family: monospace; font-size: 0.8125rem; color: #334155; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Berhasil Berhenti Berlangganan</h1>
            <p>Alamat email Anda telah ditambahkan ke daftar pemblokiran kami. Anda tidak akan lagi menerima email pengajuan lamaran karir dari pengguna platform Lolos Kerja.</p>
            <div class="email-badge">${email}</div>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(200).json({
      success: true,
      message: `Alamat ${email} telah berhasil ditambahkan ke daftar blokir.`
    });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return res.status(500).json({ error: 'Gagal memproses permohonan berhenti berlangganan.' });
  }
}
