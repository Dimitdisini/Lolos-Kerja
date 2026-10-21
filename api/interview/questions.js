/**
 * /api/interview/questions.js: Dynamic Interview Question Formulation from CV & Job Specs
 * Node.js ESM Vercel Serverless Function
 */

import { verifyAuth, getSupabaseAdmin } from '../_lib/auth.js';
import { callJson, sanitizeUserData } from '../_lib/llm.js';
import { checkQuota } from '../_lib/quota.js';
import { applyRateLimit } from '../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 25, windowMs: 60000 })) {
    return;
  }

  const authSession = await verifyAuth(req);
  if (authSession) {
    const quota = checkQuota(authSession.profile, 'interview');
    if (!quota.allowed) {
      return res.status(403).json({ error: quota.reason });
    }
  }

  const {
    cvId,
    masterProfile: inlineProfile,
    jobId,
    jobDescription,
    lang = 'id',
    count = 5
  } = req.body || {};

  try {
    let resolvedProfile = inlineProfile;
    let resolvedJobDesc = jobDescription || '';
    let supabase = null;
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase = getSupabaseAdmin();
      }
    } catch (sbErr) {
      // offline / unit-test fallback
    }

    // Ambil profile dari cv_id jika diberikan
    if (!resolvedProfile && cvId && supabase) {
      const { data: cvDoc } = await supabase
        .from('cv_documents')
        .select('master_profile')
        .eq('id', cvId)
        .single();
      if (cvDoc?.master_profile) resolvedProfile = cvDoc.master_profile;
    }

    // Ambil detail job jika jobId diberikan
    if (!resolvedJobDesc && jobId) {
      const { data: job } = await supabase
        .from('jobs')
        .select('title, company, description, skills')
        .eq('id', jobId)
        .single();
      if (job) {
        resolvedJobDesc = `Posisi: ${job.title} di ${job.company}\nKeahlian yang dibutuhkan: ${job.skills?.join(', ')}\nDeskripsi: ${job.description || ''}`;
      }
    }

    const systemPrompt = `Anda adalah Lead Technical & Behavioral HR Interviewer tingkat Enterprise.
Tugas Anda adalah merumuskan ${count} pertanyaan wawancara kerja yang spesifik, tajam, dan membumi dalam bahasa '${lang}'.

Pertanyaan harus diramu dari 3 pilar:
1. Pengalaman dan bullet nyata yang tertulis di CV kandidat.
2. Persyaratan dan kualifikasi lowongan pekerjaan target (jika ada).
3. Pertanyaan perilaku (Behavioral STAR) standar industri.

Skema JSON keluaran:
{
  "questions": [
    {
      "id": number,
      "category": "TECHNICAL" | "BEHAVIORAL_STAR" | "SITUATIONAL" | "ROLE_FIT",
      "question": string,
      "context_source": "CV_EXPERIENCE" | "JOB_REQUIREMENT" | "GENERAL_BEHAVIORAL",
      "reference_fact": string, // Fakta spesifik dari CV atau loker yang mendasari pertanyaan ini
      "follow_up_hints": string[] // 2 petunjuk pertanyaan lanjutan
    }
  ]
}`;

    const profileText = resolvedProfile ? JSON.stringify(resolvedProfile) : 'Profil Umum Fresh Graduate';
    const userPrompt = `Target Bahasa: ${lang}
Jumlah Pertanyaan: ${count}

Deskripsi Loker Target:
${sanitizeUserData(resolvedJobDesc || 'Posisi Entry Level / Fresh Graduate Umum')}

CV Kandidat:
${sanitizeUserData(profileText)}`;

    const result = await callJson({
      model: 'fast',
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 2500
    });

    return res.status(200).json({
      success: true,
      job_id: jobId || null,
      lang,
      questions: result.questions || []
    });
  } catch (err) {
    console.error('Interview Questions Error:', err);
    return res.status(500).json({
      error: 'Gagal merumuskan pertanyaan wawancara.',
      details: err.message
    });
  }
}
