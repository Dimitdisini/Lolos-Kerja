/**
 * /api/cv/save.js: Persist Approved CV Draft and Synchronize Master Profile
 * Node.js ESM format
 */

import { verifyAuth, getSupabaseAdmin } from '../../_lib/auth.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30, windowMs: 60000 })) {
    return;
  }

  const authSession = await verifyAuth(req);
  const { cvId, masterProfile, targetRole = 'Fresh Graduate' } = req.body || {};

  if (!masterProfile || typeof masterProfile !== 'object') {
    return res.status(400).json({ error: 'Data masterProfile terstruktur diperlukan.' });
  }

  try {
    let savedCvId = cvId;
    let version = 1;

    if (authSession) {
      const supabase = getSupabaseAdmin();

      // Upsert to cv_documents
      if (savedCvId) {
        const { data: updated } = await supabase
          .from('cv_documents')
          .update({
            parsed_data: masterProfile,
            target_role: targetRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', savedCvId)
          .eq('user_id', authSession.user.id)
          .select('id, version')
          .maybeSingle();

        if (updated) {
          version = (updated.version || 1) + 1;
        }
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('cv_documents')
          .insert({
            user_id: authSession.user.id,
            target_role: targetRole,
            parsed_data: masterProfile,
            raw_text: JSON.stringify(masterProfile),
            version: 1
          })
          .select('id, version')
          .maybeSingle();

        if (insErr) throw insErr;
        savedCvId = inserted?.id;
      }
    }

    return res.status(200).json({
      success: true,
      cvId: savedCvId || `local-${Date.now()}`,
      version,
      targetRole,
      message: 'Draf CV dan Master Profile berhasil disimpan.'
    });
  } catch (err) {
    console.error('[CV Save Error]:', err);
    return res.status(500).json({
      error: 'Gagal menyimpan draf CV ke database.',
      details: err.message
    });
  }
}
