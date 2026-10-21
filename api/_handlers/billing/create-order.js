/**
 * /api/billing/create-order.js: Secure Order Initialization with Server-Side Price Authority
 * Node.js ESM Vercel Serverless Function
 */

import { requireAuth, getSupabaseAdmin } from '../../_lib/auth.js';
import { getTierLimits } from '../../_lib/limits.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 15, windowMs: 60000 })) {
    return;
  }

  const authSession = await requireAuth(req, res);
  if (!authSession) return;

  const { plan } = req.body || {};
  const normalizedPlan = (plan || '').toUpperCase().trim();

  if (!['FLASH', 'DIBANTUIN', 'VIP'].includes(normalizedPlan)) {
    return res.status(400).json({
      error: 'Paket langganan tidak valid. Pilih salah satu dari: FLASH, DIBANTUIN, atau VIP.'
    });
  }

  // Otoritas harga mutlak dipegang oleh server via limits.js
  const tierInfo = getTierLimits(normalizedPlan);
  const serverPrice = tierInfo.priceIdr;

  try {
    const supabase = getSupabaseAdmin();
    const userId = authSession.user.id;
    const provider = process.env.PAYMENT_PROVIDER || 'manual';

    // Format standar Order ID: LK-ORD-<Timestamp>-<Random>
    const orderId = `LK-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: paymentRecord, error: insertErr } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: userId,
        plan: normalizedPlan,
        amount: serverPrice,
        provider,
        status: 'PENDING',
        raw_event: {
          client_ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
          user_email: authSession.user.email
        }
      })
      .select('id, order_id, plan, amount, provider, status, created_at')
      .single();

    if (insertErr || !paymentRecord) {
      console.error('Create Order Error:', insertErr);
      return res.status(500).json({ error: 'Gagal membuat pesanan pembayaran baru.' });
    }

    // Bangun instruksi pembayaran sesuai provider
    let paymentInstructions = {};
    if (provider === 'manual') {
      paymentInstructions = {
        method: 'QRIS & Transfer Bank Manual',
        qris_image_url: '/assets/qris-official.png',
        bank_accounts: [
          { bank: 'BCA', account_number: '8730819281', account_name: 'PT Fleek Group Indonesia' },
          { bank: 'Mandiri', account_number: '1310029381920', account_name: 'PT Fleek Group Indonesia' }
        ],
        admin_contact: 'https://wa.me/6281234567890?text=Konfirmasi%20Pembayaran%20Order%20' + orderId,
        note: 'Setelah melakukan transfer atau scan QRIS, harap hubungi admin atau tunggu verifikasi manual.'
      };
    } else {
      paymentInstructions = {
        method: 'Payment Gateway Automatis',
        note: 'Harap selesaikan pembayaran sesuai tautan/QRIS gateway.'
      };
    }

    return res.status(200).json({
      success: true,
      order: paymentRecord,
      instructions: paymentInstructions
    });
  } catch (err) {
    console.error('Billing Create Order Error:', err);
    return res.status(500).json({
      error: 'Terjadi kegagalan sistem saat membuat transaksi pesanan.',
      details: err.message
    });
  }
}
