/**
 * src/lib/api.js: Centralized API Fetch Client
 * Injects Supabase Bearer token, maps errors to Indonesian messages, and detects local file:// usage.
 */

import { supabase } from './supabase.js';

/**
 * Deteksi penggunaan protokol file:// lokal
 */
export function isFileProtocol() {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}

/**
 * Tampilkan banner peringatan jika dibuka via file://
 */
export function ensureAppAddressBanner() {
  if (typeof document === 'undefined') return;
  if (isFileProtocol() && !document.getElementById('fileProtocolBanner')) {
    const banner = document.createElement('div');
    banner.id = 'fileProtocolBanner';
    banner.className = 'bg-amber-500 text-slate-900 font-bold px-4 py-3 text-xs sm:text-sm text-center fixed top-0 left-0 right-0 z-50 shadow-md flex items-center justify-center gap-2';
    banner.innerHTML = `
      <span>Fitur backend memerlukan koneksi server: Buka melalui alamat web (http://localhost:5173 atau domain resmi), bukan membuka berkas lokal langsung (file://).</span>
    `;
    document.body.prepend(banner);
  }
}

/**
 * Wrapper pemanggilan API serverless /api/*
 *
 * @param {string} endpoint - misal '/api/cv/analyze'
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}) {
  ensureAppAddressBanner();

  const headers = { ...(options.headers || {}) };

  // 1. Ambil JWT sesi jika tersedia
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    // Abaikan jika tidak ada sesi aktif
  }

  // 2. Format Body JSON bila berupa plain object
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  // 3. Eksekusi fetch
  let response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
      body
    });
  } catch (netErr) {
    const errorMsg = 'Gagal terhubung ke server backend. Periksa koneksi internet Anda atau pastikan server lokal berjalan.';
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(errorMsg, 'error');
    }
    throw new Error(errorMsg);
  }

  // 4. Parsing response
  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // 5. Tangani HTTP error
  if (!response.ok) {
    const serverMessage = (typeof data === 'object' && data?.error) 
      ? data.error 
      : `Terjadi kendala pada server (Status HTTP ${response.status}).`;

    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(serverMessage, 'error');
    }

    const error = new Error(serverMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
