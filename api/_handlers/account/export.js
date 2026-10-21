/**
 * /api/account/export.js: Data Portability Export (UU PDP No. 27/2022)
 * Returns all candidate records in JSON format.
 * Node.js ESM format
 */

import { requireAuth, getSupabaseAdmin } from '../../_lib/auth.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 5, windowMs: 60000 })) {
    return;
  }

  const authSession = await requireAuth(req, res);
  if (!authSession) return;

  try {
    const supabase = getSupabaseAdmin();
    const userId = authSession.user.id;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch CV documents
    const { data: cvDocuments } = await supabase
      .from('cv_documents')
      .select('id, target_role, parsed_data, version, created_at, updated_at')
      .eq('user_id', userId);

    // Fetch applications
    const { data: applications } = await supabase
      .from('applications')
      .select('id, company, position, to_email, subject, status, sent_at, created_at')
      .eq('user_id', userId);

    // Fetch interview sessions
    const { data: interviewSessions } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', userId);

    const exportPayload = {
      app: 'Lolos Kerja',
      version: '2.3.0',
      exportedAt: new Date().toISOString(),
      user: profile,
      cvDocuments: cvDocuments || [],
      applications: applications || [],
      interviewSessions: interviewSessions || []
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="data-kandidat-${(profile?.full_name || 'user').replace(/[^a-zA-Z0-9]/g, '_')}.json"`);
    return res.status(200).json(exportPayload);
  } catch (err) {
    console.error('[Account Export Error]:', err);
    return res.status(500).json({ error: 'Gagal mengekspor data akun.', details: err.message });
  }
}
