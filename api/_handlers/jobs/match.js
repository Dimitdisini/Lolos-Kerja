/**
 * /api/jobs/match.js: Hybrid 2-Stage Profile-Job Compatibility Matching
 * Stage 1: Deterministic Multi-Parameter Scoring (Fast & Cost-Efficient)
 * Stage 2: Deep LLM Alignment for Top Candidates with Reasons & Skill Gap
 * Node.js ESM Vercel Serverless Function
 */

import { verifyAuth, getSupabaseAdmin } from '../../_lib/auth.js';
import { callJson, sanitizeUserData } from '../../_lib/llm.js';
import { isFeatureAllowed } from '../../_lib/limits.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 20, windowMs: 60000 })) {
    return;
  }

  const authSession = await verifyAuth(req);
  const { masterProfile, limit = 20 } = req.body || {};

  if (!masterProfile || typeof masterProfile !== 'object') {
    return res.status(400).json({
      error: 'Data masterProfile diperlukan untuk menjalankan pencocokan loker.'
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Ambil maksimal 100 loker aktif terbaru
    const { data: jobs, error: jobErr } = await supabase
      .from('jobs')
      .select('id, title, company, location, level, category, majors, skills, description, apply_email, apply_via')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(100);

    if (jobErr || !jobs) {
      return res.status(500).json({ error: 'Gagal mengambil data loker aktif' });
    }

    const candidateSkills = [
      ...(masterProfile.skills?.technical || []),
      ...(masterProfile.skills?.tools || []),
      ...(masterProfile.skills?.soft || [])
    ].map(s => s.toLowerCase());

    const candidateMajors = (masterProfile.education || []).map(e => (e.major || '').toLowerCase());
    const candidateRoles = (masterProfile.target_roles || []).map(r => r.toLowerCase());
    const candidateCities = (masterProfile.preferred_locations || []).map(c => c.toLowerCase());
    if (masterProfile.identity?.city) {
      candidateCities.push(masterProfile.identity.city.toLowerCase());
    }

    // TAHAP 1: Deterministic Scoring (0 - 100)
    const scoredJobs = jobs.map(job => {
      let score = 50; // Skor baseline fresh graduate

      // 1. Skill overlap (bobot 30%)
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      if (jobSkills.length > 0) {
        const matches = jobSkills.filter(js => candidateSkills.some(cs => cs.includes(js) || js.includes(cs)));
        const matchRatio = matches.length / jobSkills.length;
        score += Math.round(matchRatio * 30);
      } else {
        score += 15;
      }

      // 2. Jurusan (bobot 10%)
      const jobMajors = (job.majors || []).map(m => m.toLowerCase());
      const isAllMajors = jobMajors.some(m => m.includes('semua') || m.includes('all'));
      if (isAllMajors || jobMajors.length === 0) {
        score += 10;
      } else if (jobMajors.some(jm => candidateMajors.some(cm => cm.includes(jm) || jm.includes(cm)))) {
        score += 10;
      }

      // 3. Target Role Match (bobot 10%)
      const titleLower = job.title.toLowerCase();
      if (candidateRoles.some(cr => titleLower.includes(cr) || cr.includes(titleLower))) {
        score += 10;
      }

      const finalScore = Math.min(98, Math.max(20, score));

      return {
        ...job,
        matchScore: finalScore,
        reasons: [`Skor kecocokan awal berbasis keterampilan dan jurusan relevan (${finalScore}%).`],
        skillGap: []
      };
    });

    // Urutkan dari skor tertinggi
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
    const topShortlist = scoredJobs.slice(0, Math.min(limit, 15));

    // TAHAP 2: LLM Deep Alignment jika tier pengguna berhak mendapatkan alasan lengkap
    const userTier = authSession ? authSession.effectiveTier : 'FREE';
    const enableDeepLlm = isFeatureAllowed(userTier, 'detailed_reasons');

    if (enableDeepLlm && topShortlist.length > 0) {
      try {
        const sampleJob = topShortlist[0];
        const systemPrompt = `Anda adalah Recruitment Alignment Engine.
Analisis kesesuaian profil kandidat dengan lowongan berikut secara obyektif dan ringkas.
Kembalikan JSON:
{
  "score": number, // 0 - 100
  "reasons": string[], // 2-3 alasan kuat mengapa kandidat cocok
  "skill_gap": string[] // 1-2 keahlian yang disarankan untuk dipelajari
}`;

        const userPrompt = `Loker: ${sampleJob.title} di ${sampleJob.company}
Kualifikasi: ${sampleJob.skills?.join(', ')}
Kandidat: ${JSON.stringify(masterProfile.skills || {})} - Pendidikan: ${JSON.stringify(masterProfile.education || [])}`;

        const llmResult = await callJson({
          model: 'fast',
          system: systemPrompt,
          user: userPrompt,
          maxTokens: 500
        });

        if (llmResult?.reasons) {
          topShortlist[0].reasons = llmResult.reasons;
          topShortlist[0].skillGap = llmResult.skill_gap || [];
          topShortlist[0].matchScore = llmResult.score || topShortlist[0].matchScore;
        }
      } catch (llmErr) {
        console.warn('Tahap 2 LLM Match skipped:', llmErr.message);
      }
    }

    // Simpan ke database jika user terautentikasi
    if (authSession) {
      const matchRows = topShortlist.map(item => ({
        user_id: authSession.user.id,
        job_id: item.id,
        score: item.matchScore,
        reasons: item.reasons,
        skill_gap: item.skillGap,
        computed_at: new Date().toISOString()
      }));

      await supabase
        .from('job_matches')
        .upsert(matchRows, { onConflict: 'user_id,job_id' });
    }

    return res.status(200).json({
      success: true,
      matches: topShortlist
    });
  } catch (err) {
    console.error('Job Matching Error:', err);
    return res.status(500).json({
      error: 'Gagal menjalankan kalkulasi kecocokan loker.',
      details: err.message
    });
  }
}
