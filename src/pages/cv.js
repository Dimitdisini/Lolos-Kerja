/**
 * src/pages/cv.js: CV Module Frontend Client & Serverless Backend Wiring
 * Connects UI actions to /api/cv/* endpoints: extract, analyze, rewrite, save, export-pdf.
 */

import { apiFetch } from '../lib/api.js';
import { appState } from '../state.js';
import { showToast } from '../components/toast.js';

/**
 * Ekstraksi teks dari file dokumen (PDF, DOCX, TXT)
 * @param {File|Blob|string} fileOrContent 
 * @param {string} [filename]
 * @param {string} [mimeType]
 */
export async function extractCvDocument(fileOrContent, filename = 'cv.pdf', mimeType = 'application/pdf') {
  try {
    let content = fileOrContent;
    if (typeof fileOrContent !== 'string') {
      content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrContent);
      });
      filename = fileOrContent.name || filename;
      mimeType = fileOrContent.type || mimeType;
    }

    const result = await apiFetch('/api/cv/extract', {
      method: 'POST',
      body: { content, filename, mimeType }
    });

    if (result.needsOcr) {
      showToast('Dokumen ini terdeteksi sebagai pindaian gambar (scanned). Silakan salin teks atau isi langsung melalui formulir.', 'warning');
    }

    return result;
  } catch (err) {
    console.error('[CV Extract Error]:', err);
    showToast(err.message || 'Gagal mengekstrak teks CV.', 'error');
    throw err;
  }
}

/**
 * Menjalankan audit ATS penuh dan ekstraksi master profile via AI
 * @param {string} rawText 
 * @param {string} [targetRole]
 */
export async function analyzeCvWithBackend(rawText, targetRole = 'Fresh Graduate') {
  if (!rawText || rawText.trim().length < 50) {
    showToast('Teks CV terlalu pendek. Masukkan minimal 50 karakter teks pengalaman Anda.', 'warning');
    return null;
  }

  try {
    const result = await apiFetch('/api/cv/analyze', {
      method: 'POST',
      body: { rawText, targetRole }
    });

    // Update state
    if (result.masterProfile || result.master_profile) {
      appState.masterProfile = result.masterProfile || result.master_profile;
      appState.activeCvId = result.cvId || result.document_id || appState.activeCvId;
    }

    showToast('Audit ATS selesai dengan skor ' + (result.atsScore || result.ats_score) + '/100.', 'success');
    return result;
  } catch (err) {
    console.error('[CV Analyze Error]:', err);
    showToast(err.message || 'Gagal melakukan audit ATS.', 'error');
    throw err;
  }
}

/**
 * Memoles satu poin pengalaman dengan Google X-Y-Z STAR formula
 * @param {string} bulletText 
 * @param {string} [targetRole]
 */
export async function rewriteCvBullet(bulletText, targetRole = 'Fresh Graduate') {
  if (!bulletText || bulletText.trim().length < 5) {
    showToast('Poin pengalaman terlalu pendek untuk dipoles.', 'warning');
    return null;
  }

  try {
    const result = await apiFetch('/api/cv/rewrite', {
      method: 'POST',
      body: { bulletText, targetRole }
    });

    if (result.needsInput || result.needs_input) {
      showToast('Butuh angka konkret: ' + (result.needsInput || result.needs_input), 'info');
    } else {
      showToast('Poin pengalaman berhasil dipoles ke standar STAR!', 'success');
    }

    return result;
  } catch (err) {
    console.error('[CV Rewrite Error]:', err);
    showToast(err.message || 'Gagal memoles pengalaman.', 'error');
    throw err;
  }
}

/**
 * Menyimpan draf CV versi terverifikasi ke cv_documents
 * @param {string} cvId 
 * @param {object} masterProfile 
 * @param {string} [targetRole]
 */
export async function saveCvToBackend(cvId, masterProfile, targetRole = 'Fresh Graduate') {
  try {
    const result = await apiFetch('/api/cv/save', {
      method: 'POST',
      body: { cvId, masterProfile, targetRole }
    });

    if (result.cvId) {
      appState.activeCvId = result.cvId;
    }

    showToast('Draf CV berhasil disimpan (Versi ' + (result.version || 1) + ').', 'success');
    return result;
  } catch (err) {
    console.error('[CV Save Error]:', err);
    showToast(err.message || 'Gagal menyimpan draf CV.', 'error');
    throw err;
  }
}

/**
 * Mengekspor CV PDF standar Harvard ATS 1-kolom
 * @param {object} [masterProfile] 
 * @param {string} [cvId] 
 * @param {boolean} [downloadFile=true]
 */
export async function exportCvPdf(masterProfile, cvId, downloadFile = true) {
  const profileToExport = masterProfile || appState.masterProfile;
  if (!profileToExport) {
    showToast('Data profil CV belum tersedia. Lengkapi draf CV terlebih dahulu.', 'warning');
    return null;
  }

  try {
    if (downloadFile) {
      // Direct binary download
      const response = await fetch('/api/cv/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterProfile: profileToExport, cvId })
      });

      if (!response.ok) {
        throw new Error('Gagal mengunduh file PDF.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const candName = (profileToExport.identity?.name || 'Kandidat').replace(/\s+/g, '_');
      a.download = `CV_Harvard_ATS_${candName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast('CV PDF Harvard ATS berhasil diunduh.', 'success');
      return { success: true, blob };
    } else {
      // Signed URL / Storage upload for blast attachment
      const result = await apiFetch('/api/cv/export-pdf', {
        method: 'POST',
        body: { masterProfile: profileToExport, cvId, returnJson: true }
      });
      return result;
    }
  } catch (err) {
    console.error('[CV Export PDF Error]:', err);
    showToast(err.message || 'Gagal mengekspor PDF Harvard ATS.', 'error');
    throw err;
  }
}
