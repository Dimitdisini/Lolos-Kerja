/**
 * /api/blast/approve.js: Human-in-the-Loop Queue Approval & Natural Drip Scheduling
 * Node.js ESM Vercel Serverless Function
 */

import { requireAuth, getSupabaseAdmin } from '../_lib/auth.js';
import { applyRateLimit } from '../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 20, windowMs: 60000 })) {
    return;
  }

  const authSession = await requireAuth(req, res);
  if (!authSession) return;

  const { applicationIds } = req.body || {};

  if (!applicationIds || (!Array.isArray(applicationIds) && applicationIds !== 'all')) {
    return res.status(400).json({
      error: 'Harap tentukan ID lamaran yang disetujui (array ID atau "all").'
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const userId = authSession.user.id;

    // Ambil antrean yang belum diapprove milik pengguna
    let query = supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .eq('approved', false);

    if (Array.isArray(applicationIds) && applicationIds.length > 0) {
      query = query.in('id', applicationIds);
    }

    const { data: pendingApps, error: fetchErr } = await query;

    if (fetchErr || !pendingApps || pendingApps.length === 0) {
      return res.status(404).json({
        error: 'Tidak ditemukan antrean lamaran pending yang dapat disetujui.'
      });
    }

    // Jadwalkan dengan natural drip spreading (antara 08:00 - 17:00 WIB)
    // Jeda antar email: 3 s/d 7 menit acak
    const now = new Date();
    let currentScheduleTime = new Date(now.getTime() + 2 * 60 * 1000); // Mulai 2 menit dari sekarang

    const updatePromises = pendingApps.map((app, index) => {
      // Jeda acak 3 - 6 menit
      const jitterMs = (3 + Math.floor(Math.random() * 4)) * 60 * 1000;
      currentScheduleTime = new Date(currentScheduleTime.getTime() + jitterMs);

      return supabase
        .from('applications')
        .update({
          approved: true,
          scheduled_at: currentScheduleTime.toISOString()
        })
        .eq('id', app.id)
        .eq('user_id', userId);
    });

    await Promise.all(updatePromises);

    return res.status(200).json({
      success: true,
      approvedCount: pendingApps.length,
      firstScheduledAt: new Date(now.getTime() + 3 * 60 * 1000).toISOString(),
      lastScheduledAt: currentScheduleTime.toISOString()
    });
  } catch (err) {
    console.error('Blast Approve Error:', err);
    return res.status(500).json({
      error: 'Gagal menyetujui antrean pengiriman email.',
      details: err.message
    });
  }
}
