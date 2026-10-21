/**
 * /api/admin/overview.js: Standalone Admin Command Center Metrics & Controls
 * Access restricted exclusively to server-side verified admin/owner roles.
 * Node.js ESM format
 */

import { requireAdmin, getSupabaseAdmin } from '../../_lib/auth.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30, windowMs: 60000 })) {
    return;
  }

  const adminSession = await requireAdmin(req, res);
  if (!adminSession) return;

  try {
    const supabase = getSupabaseAdmin();

    // POST: Update system flags (e.g. toggle blast_paused or recipient_allowlist)
    if (req.method === 'POST') {
      const { action, payload } = req.body || {};

      if (action === 'toggle_pause') {
        const paused = Boolean(payload?.paused);
        await supabase
          .from('system_flags')
          .upsert({ key: 'blast_paused', value: { paused } });
        return res.status(200).json({ ok: true, blastPaused: paused });
      }

      if (action === 'update_allowlist') {
        const enabled = Boolean(payload?.enabled);
        const emails = Array.isArray(payload?.emails) ? payload.emails : [];
        await supabase
          .from('system_flags')
          .upsert({ key: 'recipient_allowlist', value: { enabled, emails } });
        return res.status(200).json({ ok: true, recipientAllowlist: { enabled, emails } });
      }

      return res.status(400).json({ error: 'Aksi admin tidak dikenali.' });
    }

    // GET: Fetch overview dashboard data
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, tier, blast_quota, daily_blast_limit, tier_expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    const { count: queuedCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued');

    const { data: flagPaused } = await supabase
      .from('system_flags')
      .select('value')
      .eq('key', 'blast_paused')
      .maybeSingle();

    const { data: flagAllowlist } = await supabase
      .from('system_flags')
      .select('value')
      .eq('key', 'recipient_allowlist')
      .maybeSingle();

    return res.status(200).json({
      success: true,
      users: users || [],
      pendingPayments: pendingPayments || [],
      queued: queuedCount || 0,
      blastPaused: flagPaused?.value?.paused ?? false,
      recipientAllowlist: flagAllowlist?.value || { enabled: false, emails: [] }
    });
  } catch (err) {
    console.error('Admin Overview Error:', err);
    return res.status(500).json({
      error: 'Gagal mengambil metrik command center admin.',
      details: err.message
    });
  }
}
