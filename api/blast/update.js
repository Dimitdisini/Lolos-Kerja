/**
 * /api/blast/update.js: Update or Cancel Queued Application
 * Node.js ESM format
 */

import { requireAuth, getSupabaseAdmin } from '../_lib/auth.js';
import { applyRateLimit } from '../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30, windowMs: 60000 })) {
    return;
  }

  const authSession = await requireAuth(req, res);
  if (!authSession) return;

  const { applicationId, subject, body, cancel = false } = req.body || {};

  if (!applicationId) {
    return res.status(400).json({ error: 'applicationId diperlukan.' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const userId = authSession.user.id;

    // Pastikan lamaran milik user yang bersangkutan dan masih berstatus queued
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status, user_id')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Lamaran tidak ditemukan atau Anda tidak memiliki akses.' });
    }

    if (existing.status !== 'queued') {
      return res.status(400).json({ error: `Lamaran dengan status '${existing.status}' tidak dapat diubah.` });
    }

    const updates = {};
    if (cancel) {
      updates.status = 'cancelled';
      updates.error = 'Dibatalkan oleh pengguna.';
    } else {
      if (subject) updates.subject = subject.trim();
      if (body) updates.body = body.trim();
    }

    const { error: updateErr } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', applicationId);

    if (updateErr) throw updateErr;

    return res.status(200).json({
      success: true,
      message: cancel ? 'Lamaran berhasil dibatalkan.' : 'Draf email lamaran berhasil diperbarui.'
    });
  } catch (err) {
    console.error('[Blast Update Error]:', err);
    return res.status(500).json({
      error: 'Gagal memperbarui status lamaran.',
      details: err.message
    });
  }
}
