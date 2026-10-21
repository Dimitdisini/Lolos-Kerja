/**
 * src/pages/account.js: Candidate Account, Data Portability & Privacy Controls
 * Connects UI actions to /api/account/export and /api/account/delete
 */

import { apiFetch } from '../lib/api.js';
import { appState } from '../state.js';
import { showToast } from '../components/toast.js';

/**
 * Ekspor seluruh data akun kandidat dalam format JSON resmi (UU PDP)
 */
export async function exportUserData() {
  try {
    const data = await apiFetch('/api/account/export', { method: 'GET' });
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LolosKerja_DataExport_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showToast('Data akun Anda berhasil diekspor ke file JSON.', 'success');
    return data;
  } catch (err) {
    console.error('[Account Export Error]:', err);
    showToast(err.message || 'Gagal mengekspor data akun.', 'error');
    throw err;
  }
}

/**
 * Menghapus akun dan seluruh data kandidat secara permanen
 * @param {string} confirmWord Harus bertuliskan "HAPUS"
 */
export async function deleteUserAccount(confirmWord) {
  if (confirmWord !== 'HAPUS') {
    showToast('Ketik "HAPUS" secara persis untuk mengonfirmasi penghapusan akun.', 'warning');
    return null;
  }

  try {
    const result = await apiFetch('/api/account/delete', {
      method: 'POST',
      body: { confirm: 'HAPUS' }
    });

    showToast('Akun Anda telah berhasil dihapus secara permanen.', 'info');
    if (typeof window !== 'undefined' && typeof window.logoutUser === 'function') {
      window.logoutUser();
    }
    return result;
  } catch (err) {
    console.error('[Account Delete Error]:', err);
    showToast(err.message || 'Gagal menghapus data akun.', 'error');
    throw err;
  }
}
