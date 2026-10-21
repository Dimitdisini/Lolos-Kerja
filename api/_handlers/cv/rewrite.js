/**
 * /api/cv/rewrite.js: Bullet Polishing with Google X-Y-Z Formula & Strict Anti-Fabrication Rule
 * Node.js ESM Vercel Serverless Function
 */

import { callJson, sanitizeUserData } from '../../_lib/llm.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 40, windowMs: 60000 })) {
    return;
  }

  const { bulletText, targetRole = 'Fresh Graduate' } = req.body || {};

  if (!bulletText || typeof bulletText !== 'string' || bulletText.trim().length < 5) {
    return res.status(400).json({
      error: 'Teks poin pengalaman (bullet) tidak boleh kosong atau terlalu pendek.'
    });
  }

  try {
    const systemPrompt = `Tugasmu merapikan satu bullet pengalaman menjadi format STAR yang ringkas dan berdampak (Google X-Y-Z formula: "Mencapai [X], yang terukur oleh [Y], dengan melakukan [Z]").

ATURAN KERAS ANTI-FABRIKASI (ZERO-HALLUCINATION):
1. Gunakan HANYA fakta yang tertulis eksplisit di dalam <user_data>.
2. DILARANG KERAS mengarang angka, metrik, persentase, nominal uang, nama tim/klien, atau tools yang tidak pernah disebutkan pengguna.
3. JIKA teks sumber tidak memiliki angka/metrik terukur, kamu WAJIB mengisi properti "needs_input" dengan satu pertanyaan spesifik dan sopan kepada pengguna (misal: "Berapa jumlah peserta yang hadir?", "Berapa persen efisiensi yang tercapai?").
4. Mulai kalimat saran (suggested) dengan kata kerja aksi kuat (Action Verb).
5. Kalimat saran maksimal 25 kata, padat dan profesional.

Kembalikan format JSON persis seperti ini:
{
  "suggested": "Poin pengalaman yang dipoles (maks 25 kata)",
  "needs_input": "Pertanyaan klarifikasi metrik jika angka tidak ada, atau null jika metrik sudah lengkap"
}`;

    const userPrompt = `Target Posisi: "${targetRole}"
Poin pengalaman asli:
${sanitizeUserData(bulletText.trim())}`;

    const result = await callJson({
      model: 'fast',
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 500,
      temperature: 0.1
    });

    const item = {
      original: bulletText.trim(),
      suggested: result.suggested,
      needsInput: result.needs_input || null,
      needs_input: result.needs_input || null
    };

    return res.status(200).json({
      success: true,
      original: item.original,
      suggested: item.suggested,
      needs_input: item.needs_input,
      needsInput: item.needsInput,
      items: [item]
    });
  } catch (err) {
    console.error('CV Rewrite Error:', err);
    return res.status(500).json({
      error: 'Gagal memoles poin pengalaman CV.',
      details: err.message
    });
  }
}
