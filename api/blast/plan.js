/**
 * /api/blast/plan.js: Daily Blast Queue Planning & Tailored Cover Letter Synthesis
 * Node.js ESM Vercel Serverless Function
 */

import { requireAuth, getSupabaseAdmin } from '../_lib/auth.js';
import { callJson, sanitizeUserData } from '../_lib/llm.js';
import { checkQuota } from '../_lib/quota.js';
import { applyRateLimit } from '../_lib/rateLimit.js';

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

    // 1. Cek berapa lamaran yang sudah direncanakan/dikirim hari ini
    const startOfDayWib = new Date();
    startOfDayWib.setHours(startOfDayWib.getHours() + 7); // WIB offset
    startOfDayWib.setUTCHours(0, 0, 0, 0);
    startOfDayWib.setHours(startOfDayWib.getHours() - 7);

    const { count: sentTodayCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfDayWib.toISOString());

    const remainingSlots = Math.max(0, dailyLimit - (sentTodayCount || 0));
    if (remainingSlots <= 0) {
      return res.status(400).json({
        error: `Batas harian pengiriman email Anda (${dailyLimit}/hari) untuk hari ini telah tercapai.`
      });
    }

    // 2. Ambil master profile pengguna
    const { data: cvDoc } = await supabase
      .from('cv_documents')
      .select('master_profile')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const candidateProfile = cvDoc?.master_profile || {};
    const candidateName = candidateProfile.identity?.name || authSession.profile.full_name || 'Kandidat Pelamar';

    // 3. Ambil daftar perusahaan yang sudah pernah dikirimi email oleh user ini dalam 30 hari
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentApps } = await supabase
      .from('applications')
      .select('company, to_email')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo);

    const appliedCompanies = new Set((recentApps || []).map(a => a.company.toLowerCase()));
    const appliedEmails = new Set((recentApps || []).map(a => a.to_email.toLowerCase()));

    // 4. Ambil email blocklist
    const { data: blocklist } = await supabase
      .from('email_blocklist')
      .select('email');
    const blockedEmails = new Set((blocklist || []).map(b => b.email.toLowerCase()));

    // 5. Cari loker target yang memenuhi syarat
    const { data: targetJobs, error: jobErr } = await supabase
      .from('jobs')
      .select('id, title, company, apply_email, description, skills')
      .eq('is_active', true)
      .eq('apply_via', 'email')
      .eq('email_valid', true)
      .gt('expires_at', new Date().toISOString())
      .limit(50);

    if (jobErr || !targetJobs || targetJobs.length === 0) {
      return res.status(404).json({
        error: 'Tidak ditemukan loker aktif berbasis email yang tersedia saat ini.'
      });
    }

    // Filter deduplikasi perusahaan & blocklist
    const validJobs = targetJobs.filter(job => {
      if (!job.apply_email) return false;
      const emailLower = job.apply_email.toLowerCase();
      const compLower = job.company.toLowerCase();
      if (blockedEmails.has(emailLower)) return false;
      if (appliedEmails.has(emailLower)) return false;
      if (appliedCompanies.has(compLower)) return false;
      return true;
    }).slice(0, remainingSlots);

    if (validJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Semua lowongan yang cocok sudah ada di antrean atau telah dilamar dalam 30 hari terakhir.',
        planned: []
      });
    }

    // 6. Buat Cover Letter personal untuk setiap loker target
    const plannedApplications = [];

    for (const job of validJobs) {
      let subject = `Lamaran Pekerjaan: ${job.title} - ${candidateName}`;
      let body = `Yth. Tim Rekrutmen ${job.company},\n\nPerkenalkan saya ${candidateName}. Saya bermaksud mengajukan lamaran untuk posisi ${job.title}.\n\nTerlampir resume lengkap saya untuk bahan pertimbangan.\n\nSalam hormat,\n${candidateName}`;

      try {
        const coverPromptSystem = `Tulis email lamaran 120-180 kata kepada tim rekrutmen perusahaan itu untuk posisi itu, memakai 2-3 fakta paling relevan dari master_profile.
Nada sopan dan lugas, tanpa klise, tanpa klaim palsu yang tidak ada di profil. Akhiri dengan ajakan singkat wawancara dan sebutkan CV terlampir.
Kembalikan JSON: {"subject": string, "body": string}`;

        const coverPromptUser = `Perusahaan: ${job.company}
Posisi: ${job.title}
Profil Kandidat: ${JSON.stringify(candidateProfile)}
Catatan Pengguna: ${customNotes}`;

        const llmResult = await callJson({
          model: 'strong',
          system: coverPromptSystem,
          user: coverPromptUser,
          maxTokens: 600
        });

        if (llmResult?.subject && llmResult?.body) {
          subject = llmResult.subject;
          body = llmResult.body;
        }
      } catch (err) {
        console.warn('Fallback standard cover letter due to LLM error:', err.message);
      }

      plannedApplications.push({
        user_id: userId,
        job_id: job.id,
        company: job.company,
        position: job.title,
        to_email: job.apply_email,
        subject,
        body,
        cv_variant_id: cvVariantId || null,
        status: 'queued',
        approved: false
      });
    }

    // 7. Simpan rencana ke tabel applications
    const { data: insertedApps, error: insertErr } = await supabase
      .from('applications')
      .insert(plannedApplications)
      .select('id, company, position, to_email, subject, body, status, approved, created_at');

    if (insertErr) {
      console.error('Insert Applications Error:', insertErr);
      return res.status(500).json({ error: 'Gagal menyimpan rencana antrean blast.' });
    }

    return res.status(200).json({
      success: true,
      count: insertedApps.length,
      remainingDailyLimit: remainingSlots - insertedApps.length,
      applications: insertedApps
    });
  } catch (err) {
    console.error('Blast Plan Handler Error:', err);
    return res.status(500).json({
      error: 'Terjadi kesalahan sistem saat merencanakan blast email.',
      details: err.message
    });
  }
}
