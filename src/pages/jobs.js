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

/**
 * Mengambil lowongan remote tech terverifikasi dari Arbeitnow API
 * @param {object} [params]
 * @returns {Promise<{success: boolean, jobs: Array, totalMatched: number}>}
 */
export async function fetchArbeitnowJobs(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.q) query.set('q', params.q);

    const endpoint = `/api/jobs/arbeitnow${query.toString() ? '?' + query.toString() : ''}`;
    return await apiFetch(endpoint, { method: 'GET' });
  } catch (err) {
    console.error('[Arbeitnow Jobs Fetch Error]:', err);
    return { success: false, jobs: [], totalMatched: 0 };
  }
}

/**
 * Mengambil lowongan entry-level dan data kultur perusahaan dari The Muse API
 * @param {number} [page=0]
 * @param {string} [level='Entry Level']
 * @returns {Promise<{success: boolean, jobs: Array, totalReturned: number}>}
 */
export async function fetchTheMuseJobs(page = 0, level = 'Entry Level') {
  try {
    const query = new URLSearchParams({ page: String(page), level });
    const endpoint = `/api/jobs/themuse?${query.toString()}`;
    return await apiFetch(endpoint, { method: 'GET' });
  } catch (err) {
    console.error('[The Muse Jobs Fetch Error]:', err);
    return { success: false, jobs: [], totalReturned: 0 };
  }
}

