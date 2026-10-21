/**
 * /api/blast/status.js: Real-Time Blast Dispatch Status & Metrics Endpoint
 * Node.js ESM format
 */

import { requireAuth, getSupabaseAdmin } from '../_lib/auth.js';
import { applyRateLimit } from '../_lib/rateLimit.js';
import { getWibDayStartIso } from './plan.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 40, windowMs: 60000 })) {
    return;
  }

  const authSession = await requireAuth(req, res);
  if (!authSession) return;

  try {
    const supabase = getSupabaseAdmin();
    const userId = authSession.user.id;
    const dailyLimit = authSession.profile.daily_blast_limit || 10;
    const startOfDayWibIso = getWibDayStartIso();

    // Ambil semua lamaran hari ini
    const { data: todayApps, error: fetchErr } = await supabase
      .from('applications')
      .select('id, company, position, to_email, subject, body, status, send_mode, scheduled_at, sent_at, error, replied_at')
      .eq('user_id', userId)
      .gte('created_at', startOfDayWibIso)
      .order('created_at', { ascending: false });

    if (fetchErr) throw fetchErr;

    const items = todayApps || [];
    const sentCount = items.filter(a => a.status === 'sent').length;
    const queuedCount = items.filter(a => a.status === 'queued' || a.status === 'sending').length;
    const failedCount = items.filter(a => a.status === 'failed').length;
    const repliedCount = items.filter(a => a.replied_at !== null).length;
    const remainingToday = Math.max(0, dailyLimit - sentCount);

    return res.status(200).json({
      success: true,
      today: {
        sent: sentCount,
        queued: queuedCount,
        failed: failedCount,
        replied: repliedCount,
        remaining: remainingToday,
        dailyLimit
      },
      items
    });
  } catch (err) {
    console.error('[Blast Status Error]:', err);
    return res.status(500).json({
      error: 'Gagal mengambil status pengiriman email.',
      details: err.message
    });
  }
}
