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

/**
 * Memeriksa kecocokan kualifikasi CV kandidat dengan posisi lowongan.
 * Menerapkan batas kompatibilitas ketat: hanya posisi serumpun yang diizinkan untuk di-blast.
 */
export function isJobCompatibleWithProfile(job, profile) {
  if (!job || !profile) return false;
  
  const targetRoles = (profile.target_roles || []).map(r => r.toLowerCase());
  const skills = [
    ...(profile.skills?.technical || []),
    ...(profile.skills?.tools || []),
    ...(profile.skills?.soft || [])
  ].map(s => s.toLowerCase());
  
  const education = (profile.education || []).map(e => `${e.major || ''} ${e.degree || ''}`.toLowerCase()).join(' ');
  const experienceText = (profile.experience || []).map(ex => `${ex.role || ''} ${ex.tasks || ''}`).join(' ').toLowerCase();
  const candidateText = `${targetRoles.join(' ')} ${skills.join(' ')} ${education} ${experienceText}`.toLowerCase();
  
  const jobTitle = (job.title || '').toLowerCase();
  const jobCategory = (job.category || '').toLowerCase();
  const jobRoleKeys = (job.role_keys || []).map(r => r.toLowerCase());
  
  const isTechCandidate = /software|developer|engineer|pemrogram|it |coding|frontend|backend|fullstack|data|ai |iot|telemetri|hardware|cloud|tech/.test(candidateText);
  const isBusinessCandidate = /business|analyst|product|manajer|manajemen|project|consulting|pmo|operas/.test(candidateText);
  const isMarketingCandidate = /market|growth|social media|copywrit|brand|creative|seo/.test(candidateText);
  const isFinanceCandidate = /akuntan|accounting|finance|pajak|tax|audit|keuangan/.test(candidateText);

  const isTechJob = /software|developer|engineer|pemrogram|data|ai|iot|cloud|tech|fullstack|backend|frontend/.test(jobTitle) || jobCategory === 'tech' || jobRoleKeys.includes('software-eng');
  const isBusinessJob = /business|product|analyst|project|pmo|operas|operations|trainee|odp|management trainee/.test(jobTitle) || jobCategory === 'business' || jobRoleKeys.includes('business-analyst') || jobRoleKeys.includes('operations-trainee');
  const isMarketingJob = /market|growth|social media|content|copywrit|brand|creative/.test(jobTitle) || jobCategory === 'marketing' || jobRoleKeys.includes('digital-marketing');
  const isFinanceJob = /akuntan|accounting|finance|tax|pajak|audit|keuangan/.test(jobTitle) || jobCategory === 'finance' || jobRoleKeys.includes('finance-accounting');

  // Hard Incompatibility Gate: Loker yang tidak cocok jangan pernah di-blast
  if (isTechCandidate && !isFinanceCandidate && isFinanceJob) return false;
  if (isFinanceCandidate && !isTechCandidate && isTechJob) return false;
  if (isTechCandidate && !isMarketingCandidate && isMarketingJob && !/growth engineer|tech marketing/.test(jobTitle)) return false;

  // Positive Affinity
  if (isTechCandidate && isTechJob) return true;
  if (isBusinessCandidate && (isBusinessJob || /trainee|analyst/i.test(jobTitle))) return true;
  if (isMarketingCandidate && isMarketingJob) return true;
  if (isFinanceCandidate && isFinanceJob) return true;

  // Management Trainee BUMN/Nasional terbuka untuk seluruh rumpun sarjana
  if (/management trainee|trainee|odp|officer development|bumn trainee/i.test(jobTitle)) return true;

  const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 3);
  const matchCount = jobWords.filter(w => candidateText.includes(w)).length;
  if (matchCount >= 2) return true;

  return false;
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
      .select('id, company, title, apply_email, email_kind, email_source_url, description, requirements, category, role_keys')
      .eq('apply_via', 'email')
      .eq('is_active', true)
      .not('apply_email', 'is', null)
      .limit(100);

    if (jobsErr) throw jobsErr;

    // Filter kandidat lowongan: belum pernah dikontak DAN wajib lolos Compatibility Gate
    const eligibleJobs = (availableJobs || []).filter(job => {
      const compKey = (job.company || '').toLowerCase().trim();
      const emailKey = (job.apply_email || '').toLowerCase().trim();
      if (contactedCompanies.has(compKey) || contactedEmails.has(emailKey)) {
        return false;
      }
      return isJobCompatibleWithProfile(job, candidateProfile);
    }).slice(0, remainingSlots);

    if (eligibleJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Tidak ada kontak rekruter baru yang 100% cocok dengan kualifikasi CV Anda hari ini. Kuota Anda tetap utuh.',
        items: [],
        remainingToday: remainingSlots
      });
    }

    const plannedItems = [];

    // 5. Susun Cover Letter Personal Standar Korporat & BUMN untuk Tiap Lowongan
    const candidateMajor = candidateProfile.education?.[0]?.major || 'Sarjana';
    const candidateCampus = candidateProfile.education?.[0]?.institution || 'Universitas Terkemuka';

    for (const job of eligibleJobs) {
      const coverLetterPrompt = `Tuliskan email lamaran kerja resmi, elegan, dan profesional (120 - 160 kata) kepada Tim Rekrutmen ${job.company} untuk posisi "${job.title}".

PROFIL RESMI KANDIDAT:
Nama: ${candidateName}
Pendidikan: ${candidateMajor}, ${candidateCampus}
Keahlian & Pengalaman Terverifikasi:
${sanitizeUserData(JSON.stringify(candidateProfile.experience || candidateProfile))}

Catatan Tambahan Kandidat: "${customNotes}"

ATURAN STRUKTUR STANDAR KORPORAT & BUMN (SATU TIPE PROFESIONAL):
1. Subjek: Lamaran: ${job.title} - ${candidateName}
2. Salam Pembuka: "Yth. Tim Rekrutmen ${job.company},"
3. Paragraf 1: Menyatakan minat melamar posisi ${job.title} dengan menyebutkan latar belakang pendidikan ${candidateMajor} dari ${candidateCampus}.
4. Paragraf 2: Tuliskan 2 poin pencapaian/proyek nyata dari data kandidat di atas yang paling relevan dengan kualifikasi ${job.title} menggunakan angka/metrik konkret (DILARANG mengarang angka atau perusahaan baru).
5. Paragraf 3: Sebutkan bahwa Curriculum Vitae (CV) terperinci format ATS terlampir, dan sampaikan ketersediaan untuk sesi wawancara.
6. Salam Penutup: "Hormat saya,\\n${candidateName}"

Kembalikan format JSON persis:
{
  "subject": "Lamaran: ${job.title} - ${candidateName}",
  "body": "Yth. Tim Rekrutmen ${job.company},\\n\\n..."
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
