/**
 * /api/cv/analyze.js: Real ATS Audit & Master Profile Extraction
 * Node.js ESM Vercel Serverless Function
 */

import crypto from 'crypto';
import { verifyAuth, getSupabaseAdmin } from '../../_lib/auth.js';
import { callJson, sanitizeUserData } from '../../_lib/llm.js';
import { checkQuota, consumeQuota } from '../../_lib/quota.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 20, windowMs: 60000 })) {
    return;
  }

  const authSession = await verifyAuth(req);
  const { rawText, targetRole = 'Fresh Graduate' } = req.body || {};

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 50) {
    return res.status(400).json({
      error: 'Teks CV terlalu pendek atau kosong. Masukkan minimal 50 karakter teks CV.'
    });
  }

  // Cek kuota jika user terautentikasi
  if (authSession) {
    const quotaStatus = checkQuota(authSession.profile, 'cv_analysis');
    if (!quotaStatus.allowed) {
      return res.status(403).json({ error: quotaStatus.reason });
    }
  }

  try {
    const contentHash = crypto.createHash('sha256').update(rawText.trim()).digest('hex');

    // Rule-based audit
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawText);
    const hasPhone = /(\+62|62|08)[0-9\s-]{8,14}/.test(rawText);
    const wordCount = rawText.trim().split(/\s+/).length;
    const hasMetrics = /\b(\d+[%kKmM]?|\$\d+|\b\d+\s*(orang|user|klien|proyek|tim|mahasiswa))\b/i.test(rawText);

    // LLM Extraction and Scoring
    const systemPrompt = `Anda adalah Lead ATS Resume Auditor dan HR Tech Specialist standar Fortune 500 dan BUMN Indonesia.
Tugas Anda adalah:
1. Mengekstrak data kandidat dari <user_data> menjadi objek master_profile standar.
2. Menghitung skor ATS riil (0-100) berdasarkan kejelasan struktur, keberadaan metrik terukur, relevansi terhadap target role, dan keterbacaan mesin.
3. Memberikan rekomendasi perbaikan konkret (tanpa mengarang fakta palsu).

Skema JSON keluaran:
{
  "ats_score": number, // 0 - 100
  "sub_scores": {
    "contact_info": number, // 0 - 100
    "experience_impact": number, // 0 - 100
    "skills_alignment": number, // 0 - 100
    "structure_formatting": number // 0 - 100
  },
  "feedback_summary": string,
  "suggestions": [
    {
      "category": string,
      "severity": "CRITICAL" | "WARNING" | "INFO",
      "issue": string,
      "recommendation": string
    }
  ],
  "master_profile": {
    "identity": {
      "name": string,
      "email": string,
      "phone": string,
      "city": string,
      "links": string[]
    },
    "summary": string,
    "education": [
      {
        "school": string,
        "degree": string,
        "major": string,
        "gpa": string,
        "start": string,
        "end": string
      }
    ],
    "experience": [
      {
        "org": string,
        "role": string,
        "start": string,
        "end": string,
        "bullets": string[],
        "type": "intern" | "work" | "org" | "project"
      }
    ],
    "skills": {
      "technical": string[],
      "tools": string[],
      "soft": string[],
      "languages": string[]
    },
    "certifications": string[],
    "target_roles": string[],
    "preferred_locations": string[]
  }
}`;

    const userPrompt = `Target Role yang dilamar: "${targetRole}"
Jumlah kata: ${wordCount}
Pemeriksaan Awal:
- Email terdeteksi: ${hasEmail}
- Nomor telepon terdeteksi: ${hasPhone}
- Keberadaan metrik terukur: ${hasMetrics}

Silakan audit data CV berikut:
${sanitizeUserData(rawText)}`;

    const result = await callJson({
      model: 'fast',
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 3000
    });

    // Simpan ke database jika user terautentikasi
    let documentId = null;
    if (authSession) {
      const supabase = getSupabaseAdmin();

      const { data: doc, error: insertErr } = await supabase
        .from('cv_documents')
        .insert({
          user_id: authSession.user.id,
          title: `CV - ${result.master_profile?.identity?.name || 'Kandidat'}`,
          raw_text: rawText,
          master_profile: result.master_profile,
          ats_score: result.ats_score,
          ats_report: {
            sub_scores: result.sub_scores,
            feedback_summary: result.feedback_summary,
            suggestions: result.suggestions
          },
          content_hash: contentHash
        })
        .select('id')
        .single();

      if (!insertErr && doc) {
        documentId = doc.id;
      }

      // Potong kuota analisis pengguna
      await consumeQuota(supabase, authSession.user.id, 'cv_analysis');
    }

    return res.status(200).json({
      success: true,
      cvId: documentId,
      document_id: documentId,
      atsScore: result.ats_score,
      ats_score: result.ats_score,
      subScores: result.sub_scores,
      sub_scores: result.sub_scores,
      feedbackSummary: result.feedback_summary,
      feedback_summary: result.feedback_summary,
      suggestions: result.suggestions,
      masterProfile: result.master_profile,
      master_profile: result.master_profile,
      report: {
        criteria: result.sub_scores || {},
        suggestions: result.suggestions || []
      }
    });
  } catch (err) {
    console.error('CV Analyze Error:', err);
    return res.status(500).json({
      error: 'Terjadi kegagalan saat menganalisis CV dengan mesin AI.',
      details: err.message
    });
  }
}
