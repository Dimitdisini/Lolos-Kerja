/**
 * /api/blast/plan.js: Daily Blast Queue Planning & Tailored Cover Letter Synthesis
 * Aligned with Section 3.1 & B8 fix (accurate WIB day start)
 * Node.js ESM format
 */

import { requireAuth, getSupabaseAdmin } from '../../_lib/auth.js';
import { callJson, sanitizeUserData } from '../../_lib/llm.js';
import { checkQuota } from '../../_lib/quota.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

/**
 * Menghitung batas awal hari WIB secara akurat menggunakan Intl timeZone (B8)
 */
export function getWibDayStartIso() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return new Date(`${year}-${month}-${day}T00:00:00+07:00`).toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 10, windowMs: 60000 })) {
    return;
  }

  const authSession = await requireAuth(req, res);
  if (!authSession) return;

  const quota = checkQuota(authSession.profile, 'blast');
  if (!quota.allowed) {
    return res.status(403).json({ error: quota.reason });
  }

  const { cvVariantId, customNotes = '' } = req.body || {};

  try {
    const supabase = getSupabaseAdmin();
    const userId = authSession.user.id;
    const dailyLimit = authSession.profile.daily_blast_limit || 10;

    // 1. Cek berapa lamaran yang sudah direncanakan/dikirim hari ini (WIB akurat - B8)
    const startOfDayWibIso = getWibDayStartIso();

    const { count: sentTodayCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfDayWibIso);

    const remainingSlots = Math.max(0, dailyLimit - (sentTodayCount || 0));
    if (remainingSlots <= 0) {
      return res.status(400).json({
        error: `Batas harian pengiriman email Anda (${dailyLimit}/hari) untuk hari ini telah tercapai.`
      });
    }

    // 2. Ambil master profile pengguna
    const { data: cvDoc } = await supabase
      .from('cv_documents')
      .select('id, master_profile, parsed_data, pdf_path')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const candidateProfile = cvDoc?.master_profile || cvDoc?.parsed_data || {};
    const candidateName = candidateProfile.identity?.fullName || candidateProfile.identity?.name || authSession.profile.full_name || 'Kandidat Pelamar';

    // 3. Ambil daftar perusahaan yang sudah pernah dikirimi email oleh user ini dalam 30 hari
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentApps } = await supabase
      .from('applications')
      .select('company, to_email')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo);

    const contactedCompanies = new Set((recentApps || []).map(a => (a.company || '').toLowerCase().trim()));
    const contactedEmails = new Set((recentApps || []).map(a => (a.to_email || '').toLowerCase().trim()));

    // 4. Ambil lowongan yang punya email resmi valid dan belum pernah dikontak
    const { data: availableJobs, error: jobsErr } = await supabase
      .from('jobs')
      .select('id, company, title, apply_email, email_kind, email_source_url, description, requirements')
      .eq('apply_via', 'email')
      .eq('is_active', true)
      .not('apply_email', 'is', null)
      .limit(50);

    if (jobsErr) throw jobsErr;

    // Filter kandidat lowongan
    const eligibleJobs = (availableJobs || []).filter(job => {
      const compKey = (job.company || '').toLowerCase().trim();
      const emailKey = (job.apply_email || '').toLowerCase().trim();
      return !contactedCompanies.has(compKey) && !contactedEmails.has(emailKey);
    }).slice(0, remainingSlots);

    if (eligibleJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Tidak ada kontak rekruter baru yang tersedia untuk antrean hari ini.',
        items: [],
        remainingToday: remainingSlots
      });
    }

    const plannedItems = [];

    // 5. Susun Cover Letter Personal untuk Tiap Lowongan
    for (const job of eligibleJobs) {
      const coverLetterPrompt = `Tulis email lamaran kerja formal (120 - 180 kata) kepada tim rekrutmen ${job.company} untuk posisi "${job.title}".
Gunakan HANYA 2-3 fakta pengalaman relevan dari kandidat:
${sanitizeUserData(JSON.stringify(candidateProfile))}

Catatan tambahan dari kandidat: "${customNotes}"

ATURAN KETAT:
1. Nada sopan, profesional, dan lugas.
2. Dilarang mengarang klaim atau angka di luar profil kandidat.
3. Sebutkan bahwa Curriculum Vitae lengkap terlampir pada email.
4. Akhiri dengan ajakan wawancara singkat.

Kembalikan format JSON:
{
  "subject": "Lamaran: [Judul Posisi] - [Nama Lengkap] (Fresh Graduate)",
  "body": "Isi lengkap email..."
}`;

      const coverLetterResult = await callJson({
        model: 'strong',
        system: 'Anda adalah Senior Career Consultant standar HR BUMN & Multinasional.',
        user: coverLetterPrompt,
        maxTokens: 500,
        temperature: 0.2
      });

      // 6. Buat entri applications berstatus 'queued'
      const { data: newApp, error: appErr } = await supabase
        .from('applications')
        .insert({
          user_id: userId,
          job_id: job.id,
          company: job.company,
          position: job.title,
          to_email: job.apply_email.toLowerCase().trim(),
          subject: coverLetterResult.subject,
          body: coverLetterResult.body,
          status: 'queued',
          approved: false,
          attachment_path: cvDoc?.pdf_path || null,
          attachment_name: `CV_${candidateName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        })
        .select('id, company, position, to_email, subject, body, status')
        .single();

      if (!appErr && newApp) {
        plannedItems.push({
          applicationId: newApp.id,
          company: newApp.company,
          position: newApp.position,
          toEmail: newApp.to_email,
          emailKind: job.email_kind || 'recruiting',
          subject: newApp.subject,
          body: newApp.body
        });
      }
    }

    return res.status(200).json({
      success: true,
      items: plannedItems,
      plannedCount: plannedItems.length,
      remainingToday: remainingSlots - plannedItems.length
    });
  } catch (err) {
    console.error('[Blast Plan Error]:', err);
    return res.status(500).json({
      error: 'Gagal menyusun antrean harian Auto-Blast.',
      details: err.message
    });
  }
}
