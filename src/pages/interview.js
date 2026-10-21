/**
 * src/pages/interview.js: Voice & Mock Interview Module Frontend Client
 * Connects UI actions to /api/interview/questions and /api/interview/score
 */

import { apiFetch } from '../lib/api.js';
import { appState } from '../state.js';
import { showToast } from '../components/toast.js';

/**
 * Deteksi filler words murni vs hedging
 * @param {string} text 
 */
export function analyzeDeliveryMetrics(text, durationSeconds = 0) {
  if (!text || typeof text !== 'string') {
    return { wpm: null, pureFillers: [], hedgingWords: [], totalFillers: 0, deliveryScore: 100 };
  }

  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // WPM calculation only when real duration is available (> 0)
  const wpm = (durationSeconds > 0) ? Math.round((wordCount / durationSeconds) * 60) : null;

  // Pure filler sounds vs hedging
  const pureFillerPatterns = ['aaa', 'eee', 'hmm', 'um', 'uh', 'anu', 'kayak'];
  const hedgingPatterns = ['mungkin', 'sepertinya', 'kayaknya', 'kurang lebih', 'maybe', 'actually'];

  const pureFillers = [];
  const hedgingWords = [];

  for (const w of words) {
    const clean = w.replace(/[^a-zA-Z]/g, '');
    if (pureFillerPatterns.includes(clean)) pureFillers.push(clean);
    if (hedgingPatterns.includes(clean)) hedgingWords.push(clean);
  }

  const totalFillers = pureFillers.length + hedgingWords.length;
  // Delivery score deduction: 4 points per pure filler, 2 points per hedging word
  const penalty = (pureFillers.length * 4) + (hedgingWords.length * 2);
  const deliveryScore = Math.max(20, Math.min(100, 100 - penalty));

  return {
    wpm,
    pureFillers,
    hedgingWords,
    totalFillers,
    deliveryScore
  };
}

/**
 * Merumuskan daftar pertanyaan wawancara dari CV dan lowongan
 * @param {object} options { cvId, jobId, lang, count }
 */
export async function fetchInterviewQuestions(options = {}) {
  try {
    const result = await apiFetch('/api/interview/questions', {
      method: 'POST',
      body: {
        cvId: options.cvId || appState.activeCvId,
        masterProfile: appState.masterProfile,
        jobId: options.jobId || null,
        lang: options.lang || 'id',
        count: options.count || 5
      }
    });

    if (result.questions && result.questions.length > 0) {
      showToast(`Berhasil memuat ${result.questions.length} pertanyaan wawancara.`, 'success');
    }
    return result;
  } catch (err) {
    console.error('[Interview Questions Error]:', err);
    showToast(err.message || 'Gagal memuat pertanyaan wawancara.', 'error');
    throw err;
  }
}

/**
 * Menilai jawaban kandidat berdasarkan rubrik STAR dan konsistensi CV
 * @param {object} payload { question, transcript, durationSeconds, cvId, sessionId }
 */
export async function scoreInterviewAnswer(payload) {
  if (!payload.transcript || payload.transcript.trim().length < 5) {
    showToast('Jawaban terlalu pendek untuk dinilai. Berikan penjelasan lebih lengkap.', 'warning');
    return null;
  }

  try {
    const result = await apiFetch('/api/interview/score', {
      method: 'POST',
      body: {
        question: payload.question,
        transcript: payload.transcript,
        durationSeconds: payload.durationSeconds || 0,
        cvId: payload.cvId || appState.activeCvId,
        masterProfile: appState.masterProfile,
        sessionId: payload.sessionId || null
      }
    });

    // Client-side delivery metrics
    const delivery = analyzeDeliveryMetrics(payload.transcript, payload.durationSeconds || 0);
    result.delivery = delivery;

    showToast(`Penilaian selesai. Skor Relevansi: ${result.relevance_score || result.relevance || 0}%, Delivery: ${delivery.deliveryScore}%`, 'success');
    return result;
  } catch (err) {
    console.error('[Interview Score Error]:', err);
    showToast(err.message || 'Gagal menilai jawaban wawancara.', 'error');
    throw err;
  }
}
