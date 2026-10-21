/**
 * src/pages/billing.js: Billing & Subscription Module Frontend Client
 * Connects UI actions to /api/billing/* and /api/config endpoints:
 * create-order, admin-confirm, webhook, config.
 */

import { apiFetch } from '../lib/api.js';
import { appState } from '../state.js';
import { showToast } from '../components/toast.js';

/**
 * Mengambil konfigurasi resmi tier, kuota, dan harga dari backend
 * Single source of truth.
 */
export async function fetchAppConfig() {
  try {
    const config = await apiFetch('/api/config', { method: 'GET' });
    return config;
  } catch (err) {
    console.error('[Config Fetch Error]:', err);
    return null;
  }
}

/**
 * Membuat pesanan pembayaran baru dengan otoritas harga di server
 * @param {'FLASH'|'DIBANTUIN'|'VIP'} plan 
 * @returns {Promise<{orderId: string, amount: number, instructions: object}>}
 */
export async function createPaymentOrder(plan) {
  try {
    const result = await apiFetch('/api/billing/create-order', {
      method: 'POST',
      body: { plan }
    });

    showToast(`Pesanan berhasil dibuat: ${result.order_id || result.orderId}. Silakan lakukan pembayaran.`, 'info');
    return result;
  } catch (err) {
    console.error('[Billing Create Order Error]:', err);
    showToast(err.message || 'Gagal membuat pesanan pembayaran.', 'error');
    throw err;
  }
}

/**
 * Konfirmasi pembayaran manual oleh Admin/Owner
 * @param {string} orderId 
 */
export async function adminConfirmPayment(orderId) {
  try {
    const result = await apiFetch('/api/billing/admin-confirm', {
      method: 'POST',
      body: { orderId }
    });

    showToast(`Pesanan ${orderId} berhasil dikonfirmasi (Settled). Paket telah aktif!`, 'success');
    return result;
  } catch (err) {
    console.error('[Admin Confirm Error]:', err);
    showToast(err.message || 'Gagal mengonfirmasi pembayaran.', 'error');
    throw err;
  }
}

/**
 * Simulasi atau pengujian webhook gateway pembayaran
 * @param {object} payload 
 */
export async function triggerBillingWebhookTest(payload) {
  try {
    const result = await apiFetch('/api/billing/webhook', {
      method: 'POST',
      body: payload
    });
    return result;
  } catch (err) {
    console.error('[Billing Webhook Error]:', err);
    throw err;
  }
}
