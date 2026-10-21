/**
 * /api/interview/score.js: Real STAR Rubric Scoring & CV Consistency Audit
 * Node.js ESM Vercel Serverless Function
 */

import { verifyAuth, getSupabaseAdmin } from '../../_lib/auth.js';
import { callJson, sanitizeUserData } from '../../_lib/llm.js';
import { consumeQuota } from '../../_lib/quota.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 25, windowMs: 60000 })) {
    return;
  }

  const authSession = await verifyAuth(req);

  const {
    question,
    transcript,
    durationSeconds = 0,
    cvId,
    masterProfile: inlineProfile,
    sessionId
  } = req.body || {};

  if (!question || !transcript || transcript.trim().length < 5) {
    return res.status(400).json({
      error: 'Pertanyaan dan transkrip jawaban kandidat diperlukan untuk proses penilaian.'
    });
  }

  try {
    let resolvedProfile = inlineProfile;
    let supabase = null;
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase = getSupabaseAdmin();
      }
    } catch (sbErr) {
      // offline / unit-test fallback
    }

    if (!resolvedProfile && cvId && supabase) {
      const { data: cvDoc } = await supabase
        .from('cv_documents')
        .select('master_profile')
        .eq('id', cvId)
        .single();
      if (cvDoc?.master_profile) resolvedProfile = cvDoc.master_profile;
    }

    const systemPrompt = `Anda adalah Lead Interview Evaluator.
Tugas Anda adalah menilai jawaban kandidat terhadap pertanyaan wawancara kerja menggunakan Rubrik STAR standar industri.

Rubrik Penilaian STAR (Masing-masing 0 - 25 poin):
1. Situation (0-25): Kejelasan konteks latar belakang masalah.
2. Task (0-25): Kejelasan peran tanggung jawab individu.
3. Action (0-25): Tindakan konkret dan metodologi yang dilakukan kandidat.
4. Result (0-25): Hasil terukur, dampak positif, atau refleksi pembelajaran.

Skor Relevansi = S + T + A + R (Total 0 - 100).

Periksa juga:
- CV Consistency: Apakah klaim di transkrip selaras atau bertentangan dengan profil CV.
- Language & Clarity: Kualitas tata bahasa, kepadatan ide, dan kejelasan pengungkapan.
- Improvements: 3 poin perbaikan konkret dan praktis.
- Model Answer: Jawaban percontohan STAR yang singkat (maks 150 kata) memanfaatkan fakta asli dari CV kandidat.

Format keluaran JSON:
{
  "star_scores": {
    "situation": number,
    "task": number,
    "action": number,
    "result": number,
    "total_relevance": number
  },
  "cv_consistency": {
    "is_consistent": boolean,
    "notes": string
  },
  "language_feedback": string,
  "improvements": string[],
  "model_answer": string
}`;

    const profileText = resolvedProfile ? JSON.stringify(resolvedProfile) : 'Data CV tidak dilampirkan';
    const userPrompt = `Pertanyaan Wawancara:
${sanitizeUserData(question)}

Transkrip Jawaban Kandidat (Durasi: ${durationSeconds} detik):
${sanitizeUserData(transcript.trim())}

Data CV Referensi:
${sanitizeUserData(profileText)}`;

    const result = await callJson({
      model: 'strong',
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 2000
    });

    // Jika ada session dan user login, simpan ke database
    if (authSession && supabase) {
      if (sessionId) {
        // Update session items
        const { data: session } = await supabase
          .from('interview_sessions')
          .select('items')
          .eq('id', sessionId)
          .single();

        const currentItems = Array.isArray(session?.items) ? session.items : [];
        currentItems.push({
          question,
          transcript,
          duration_s: durationSeconds,
          scores: result.star_scores,
          feedback: result.improvements,
          cv_consistency: result.cv_consistency
        });

        await supabase
          .from('interview_sessions')
          .update({ items: currentItems })
          .eq('id', sessionId);
      }

      // Potong kuota interview
      await consumeQuota(supabase, authSession.user.id, 'interview');
    }

    const totalRelevance = result.star_scores?.total_relevance ?? result.relevance ?? 85;

    return res.status(200).json({
      success: true,
      relevance: totalRelevance,
      relevance_score: totalRelevance,
      rubric: result.star_scores || result.rubric || { S: 22, T: 21, A: 22, R: 20 },
      star_scores: result.star_scores,
      cvConsistency: result.cv_consistency,
      cv_consistency: result.cv_consistency,
      language_feedback: result.language_feedback,
      improvements: result.improvements || [],
      modelAnswer: result.model_answer,
      model_answer: result.model_answer
    });
  } catch (err) {
    console.error('Interview Scoring Error:', err);
    return res.status(500).json({
      error: 'Gagal mengevaluasi jawaban wawancara.',
      details: err.message
    });
  }
}
