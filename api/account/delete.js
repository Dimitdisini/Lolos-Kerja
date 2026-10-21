/**
 * /api/account/delete.js: Right to be Forgotten & Account Deletion (UU PDP No. 27/2022)
 * Irrevocably removes candidate profile, CV documents, storage files, and applications.
 * Node.js ESM format
 */

import { requireAuth, getSupabaseAdmin } from '../_lib/auth.js';
import { applyRateLimit } from '../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 3, windowMs: 60000 })) {
    return;
  }

  const authSession = await requireAuth(req, res);
  if (!authSession) return;

  const { confirm } = req.body || {};
  if (confirm !== 'HAPUS') {
    return res.status(400).json({
      error: 'Konfirmasi tidak valid. Ketik "HAPUS" secara persis untuk menyetujui penghapusan seluruh data akun Anda.'
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const userId = authSession.user.id;

    // 1. Hapus riwayat lamaran
    await supabase.from('applications').delete().eq('user_id', userId);

    // 2. Hapus sesi wawancara
    await supabase.from('interview_sessions').delete().eq('user_id', userId);

    // 3. Hapus dokumen CV
    await supabase.from('cv_documents').delete().eq('user_id', userId);

    // 4. Hapus berkas PDF di Storage jika ada
    try {
      const { data: files } = await supabase.storage.from('cv-pdf').list(userId);
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${userId}/${f.name}`);
        await supabase.storage.from('cv-pdf').remove(filePaths);
      }
    } catch (storageErr) {
      console.warn('Gagal menghapus file storage akun:', storageErr.message);
    }

    // 5. Hapus profil pengguna
    await supabase.from('profiles').delete().eq('id', userId);

    return res.status(200).json({
      ok: true,
      message: 'Seluruh data akun Anda berhasil dihapus secara permanen dari sistem Lolos Kerja.'
    });
  } catch (err) {
    console.error('Account Delete Error:', err);
    return res.status(500).json({
      error: 'Terjadi kegagalan saat memproses penghapusan akun.',
      details: err.message
    });
  }
}
