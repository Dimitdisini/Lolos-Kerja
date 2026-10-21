/**
 * src/pages/jobs.js: Job Catalog & Matching Frontend Client
 * Connects UI actions to /api/jobs/list and /api/jobs/match
 */

import { apiFetch } from '../lib/api.js';
import { appState } from '../state.js';
import { showToast } from '../components/toast.js';

/**
 * Mengambil daftar lowongan terkurasi dari database jobs
 * @param {object} [params]
 * @returns {Promise<{items: Array, total: number, page: number}>}
 */
export async function fetchJobsList(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.level && params.level !== 'all') query.set('level', params.level);
    if (params.location && params.location !== 'all') query.set('location', params.location);
    if (params.apply_via) query.set('apply_via', params.apply_via);
    if (params.q) query.set('q', params.q);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const endpoint = `/api/jobs/list${query.toString() ? '?' + query.toString() : ''}`;
    const result = await apiFetch(endpoint, { method: 'GET' });
    return result;
  } catch (err) {
    console.error('[Jobs List Error]:', err);
    showToast(err.message || 'Gagal mengambil daftar lowongan pekerjaan.', 'error');
    return { items: [], total: 0, page: 1 };
  }
}

/**
 * Mencocokkan lowongan aktif dengan masterProfile CV pengguna
 * @param {string} [cvId] 
 * @param {object} [masterProfile] 
 * @returns {Promise<{matches: Array}>}
 */
export async function matchJobsWithCv(cvId, masterProfile) {
  const profile = masterProfile || appState.masterProfile;
  if (!profile) {
    showToast('Silakan lengkapi atau unggah CV terlebih dahulu untuk melihat skor kecocokan.', 'info');
    return { matches: [] };
  }

  try {
    const result = await apiFetch('/api/jobs/match', {
      method: 'POST',
      body: { cvId: cvId || appState.activeCvId, masterProfile: profile }
    });

    if (Array.isArray(result.matches)) {
      showToast(`Berhasil mencocokkan ${result.matches.length} lowongan dengan profil CV Anda.`, 'success');
    }
    return result;
  } catch (err) {
    console.error('[Jobs Match Error]:', err);
    showToast(err.message || 'Gagal menghitung kecocokan lowongan.', 'error');
    return { matches: [] };
  }
}
