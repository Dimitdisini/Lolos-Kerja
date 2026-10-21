/**
 * /api/billing/admin-confirm.js: Idempotent Manual Order Settlement by Admin/Owner
 * Node.js ESM Vercel Serverless Function
 */

import { requireAdmin, getSupabaseAdmin } from '../../_lib/auth.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30, windowMs: 60000 })) {
    return;
  }

  const adminSession = await requireAdmin(req, res);
  if (!adminSession) return;

  const { orderId, paymentId } = req.body || {};

  if (!orderId && !paymentId) {
    return res.status(400).json({
      error: 'Harap sertakan orderId atau paymentId yang akan dikonfirmasi.'
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Ambil data payment
    let query = supabase.from('payments').select('*');
    if (orderId) {
      query = query.eq('order_id', orderId);
    } else {
      query = query.eq('id', paymentId);
    }

    const { data: payment, error: fetchErr } = await query.single();

    if (fetchErr || !payment) {
      return res.status(404).json({ error: 'Transaksi pembayaran tidak ditemukan.' });
    }

    // 2. IDEMPOTENCY CHECK: Cegah double settlement & double credit
    if (payment.status === 'SETTLED') {
      return res.status(409).json({
        error: 'Transaksi ini sudah berstatus SETTLED sebelumnya. Penambahan kuota tidak diulang.',
        payment
      });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        error: `Transaksi berstatus '${payment.status}' tidak dapat diselesaikan.`
      });
    }

    // 3. Update status pembayaran menjadi SETTLED
    const { error: updateErr } = await supabase
      .from('payments')
      .update({
        status: 'SETTLED',
        settled_at: new Date().toISOString(),
        raw_event: {
          ...payment.raw_event,
          confirmed_by_admin: adminSession.user.email,
          confirmed_at: new Date().toISOString()
        }
      })
      .eq('id', payment.id);

    if (updateErr) {
      console.error('Update Payment Error:', updateErr);
      return res.status(500).json({ error: 'Gagal memperbarui status transaksi.' });
    }

    // 4. Terapkan paket ke akun pengguna via fungsi atomic database apply_plan
    const { data: planResult, error: planErr } = await supabase.rpc('apply_plan', {
      p_user_id: payment.user_id,
      p_plan: payment.plan
    });

    if (planErr) {
      console.error('Apply Plan RPC Error:', planErr);
      return res.status(500).json({
        error: 'Pembayaran telah diselesaikan, namun gagal menerapkan hak akses paket pada profil.',
        details: planErr.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Pesanan ${payment.order_id} berhasil diselesaikan. Hak akses paket ${payment.plan} telah aktif.`,
      paymentId: payment.id,
      orderId: payment.order_id,
      plan: payment.plan,
      user_id: payment.user_id,
      planDetails: planResult
    });
  } catch (err) {
    console.error('Admin Confirm Error:', err);
    return res.status(500).json({
      error: 'Terjadi kegagalan server saat mengonfirmasi pembayaran.',
      details: err.message
    });
  }
}
