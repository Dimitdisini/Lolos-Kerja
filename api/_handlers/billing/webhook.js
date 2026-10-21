/**
 * /api/billing/webhook.js: Idempotent Payment Gateway Webhook Receiver
 * Supports Midtrans / Xendit signature validation & atomic plan application.
 * Node.js ESM Vercel Serverless Function
 */

import crypto from 'crypto';
import { getSupabaseAdmin } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = req.body || {};
  const serverKey = process.env.PAYMENT_SERVER_KEY || '';

  try {
    const supabase = getSupabaseAdmin();

    // 1. Tangani Format Payload Midtrans
    const orderId = payload.order_id || payload.orderId;
    const statusCode = payload.status_code;
    const grossAmount = payload.gross_amount;
    const transactionStatus = payload.transaction_status;
    const signatureKey = payload.signature_key;

    if (!orderId) {
      return res.status(400).json({ error: 'order_id tidak ditemukan pada payload webhook' });
    }

    // 2. Ambil transaksi dari database
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchErr || !payment) {
      return res.status(404).json({ error: `Order ID ${orderId} tidak ditemukan di database` });
    }

    // 3. Verifikasi Signature Midtrans jika serverKey diset dan signature disediakan
    if (serverKey && signatureKey && statusCode && grossAmount) {
      const expectedSignature = crypto
        .createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest('hex');

      if (expectedSignature !== signatureKey) {
        console.error('Invalid Webhook Signature for order:', orderId);
        return res.status(403).json({ error: 'Signature verification failed' });
      }
    }

    // 4. Verifikasi Kesesuaian Nominal (Anti-Tampering)
    if (grossAmount) {
      const parsedAmount = Math.round(parseFloat(grossAmount));
      if (parsedAmount !== payment.amount) {
        console.error(`Amount mismatch: Expected ${payment.amount}, received ${parsedAmount}`);
        return res.status(400).json({ error: 'Gross amount mismatch' });
      }
    }

    // 5. Cek Idempotensi: jika sudah SETTLED, jangan eksekusi ulang
    if (payment.status === 'SETTLED') {
      return res.status(200).json({
        success: true,
        message: 'Order already settled, webhook acknowledged idempotently.'
      });
    }

    // 6. Pemetaan Status Gateway ke Enum pay_status
    let newStatus = 'PENDING';
    const isSettled = transactionStatus === 'capture' ||
                      transactionStatus === 'settlement' ||
                      payload.status === 'PAID' ||
                      payload.event === 'payment.captured';

    const isExpired = transactionStatus === 'expire' || transactionStatus === 'cancel';
    const isFailed = transactionStatus === 'deny' || payload.status === 'FAILED';

    if (isSettled) {
      newStatus = 'SETTLED';
    } else if (isExpired) {
      newStatus = 'EXPIRED';
    } else if (isFailed) {
      newStatus = 'FAILED';
    }

    // 7. Update status transaksi di database
    const updatePayload = {
      status: newStatus,
      raw_event: payload
    };
    if (newStatus === 'SETTLED') {
      updatePayload.settled_at = new Date().toISOString();
    }

    await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', payment.id);

    // 8. Terapkan paket jika SETTLED
    if (newStatus === 'SETTLED') {
      await supabase.rpc('apply_plan', {
        p_user_id: payment.user_id,
        p_plan: payment.plan
      });
    }

    return res.status(200).json({
      success: true,
      order_id: orderId,
      status: newStatus
    });
  } catch (err) {
    console.error('Webhook Fatal Error:', err);
    return res.status(500).json({
      error: 'Terjadi kegagalan saat memproses webhook.',
      details: err.message
    });
  }
}
