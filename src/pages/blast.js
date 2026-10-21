/**
 * src/pages/blast.js: Real Blast Dispatch Frontend Client
 * Connects UI actions to /api/blast/* endpoints: plan, approve, update, status.
 */

import { apiFetch } from '../lib/api.js';
import { appState } from '../state.js';
import { showToast } from '../components/toast.js';

/**
 * Menyusun antrean blast harian dengan cover letter personal
 * @param {object} [options]
 * @returns {Promise<{items: Array, remainingToday: number}>}
 */
export async function planDailyBlast(options = {}) {
  try {
    const result = await apiFetch('/api/blast/plan', {
      method: 'POST',
      body: {
        cvVariantId: options.cvVariantId,
        customNotes: options.customNotes || ''
      }
    });

    if (result.items && result.items.length > 0) {
      showToast(`Antrean berhasil disusun: ${result.items.length} lowongan siap ditinjau.`, 'success');
    } else {
      showToast(result.message || 'Tidak ada target baru yang tersedia untuk antrean hari ini.', 'info');
    }
    return result;
  } catch (err) {
    console.error('[Blast Plan Error]:', err);
    showToast(err.message || 'Gagal menyusun antrean email.', 'error');
    throw err;
  }
}

/**
 * Menyetujui antrean pengiriman email lamaran
 * @param {string[]|string} [applicationIds]
 * @returns {Promise<{scheduled: Array}>}
 */
export async function approveBlastApplications(applicationIds = null) {
  try {
    const body = applicationIds ? { applicationIds: Array.isArray(applicationIds) ? applicationIds : [applicationIds] } : { all: true };
    const result = await apiFetch('/api/blast/approve', {
      method: 'POST',
      body
    });

    showToast(`Berhasil menyetujui jadwal pengiriman ${result.scheduled?.length || 0} email.`, 'success');
    return result;
  } catch (err) {
    console.error('[Blast Approve Error]:', err);
    showToast(err.message || 'Gagal menyetujui pengiriman lamaran.', 'error');
    throw err;
  }
}

/**
 * Mengambil ringkasan metrik dan daftar pengiriman blast hari ini
 * @param {string} [date]
 * @returns {Promise<{today: object, items: Array}>}
 */
export async function getBlastStatus(date) {
  try {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const result = await apiFetch(`/api/blast/status${query}`, { method: 'GET' });
    return result;
  } catch (err) {
    console.error('[Blast Status Error]:', err);
    return {
      today: { sent: 0, queued: 0, failed: 0, replied: 0, remaining: 0 },
      items: []
    };
  }
}

/**
 * Mengubah isi subjek, body, atau membatalkan antrean lamaran
 * @param {string} applicationId 
 * @param {object} updates { subject, body, cancel }
 */
export async function updateBlastItem(applicationId, updates = {}) {
  try {
    const result = await apiFetch('/api/blast/update', {
      method: 'PATCH',
      body: { applicationId, ...updates }
    });

    if (updates.cancel) {
      showToast('Lamaran berhasil dibatalkan dari antrean.', 'info');
    } else {
      showToast('Perubahan surat lamaran berhasil disimpan.', 'success');
    }
    return result;
  } catch (err) {
    console.error('[Blast Update Error]:', err);
    showToast(err.message || 'Gagal memperbarui lamaran.', 'error');
    throw err;
  }
}

/**
 * Menguji webhook penerimaan event Resend (khusus admin/monitoring)
 * @param {object} eventPayload 
 */
export async function triggerResendWebhookTest(eventPayload) {
  try {
    const result = await apiFetch('/api/blast/webhook-resend', {
      method: 'POST',
      body: eventPayload
    });
    return result;
  } catch (err) {
    console.error('[Webhook Resend Error]:', err);
    throw err;
  }
}
