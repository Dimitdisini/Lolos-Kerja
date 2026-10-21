/**
 * src/router.js: Lightweight Client-Side Tab Router with Strict Route Guards
 */

import { appState } from './state.js';
import { showToast } from './components/toast.js';

export const RESTRICTED_TABS = ['blast-module', 'account-module'];

/**
 * Berpindah tab tampilan utama dengan validasi autentikasi
 */
export function navigateTo(tabId) {
  // 1. Route guard check
  if (RESTRICTED_TABS.includes(tabId)) {
    if (!appState.user || !appState.user.isLoggedIn) {
      showToast('Silakan masuk ke akun Anda terlebih dahulu untuk membuka menu ini.', 'info');
      if (typeof window !== 'undefined' && typeof window.openAuthModal === 'function') {
        window.openAuthModal('login');
      }
      return false;
    }
  }

  // 2. Update active DOM elements
  appState.currentTab = tabId;

  if (typeof document !== 'undefined') {
    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.remove('active');
    });

    const targetEl = document.getElementById(tabId);
    if (targetEl) {
      targetEl.classList.add('active');
    }

    // Update Desktop Nav Active Indicator
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const target = btn.getAttribute('data-target') || btn.getAttribute('onclick')?.match(/switchTab\('([^']+)'\)/)?.[1];
      if (target === tabId) {
        btn.classList.add('text-blue-600', 'font-bold');
        btn.classList.remove('text-slate-600');
      } else {
        btn.classList.remove('text-blue-600', 'font-bold');
        btn.classList.add('text-slate-600');
      }
    });

    // Update Mobile Bottom Bar Active Indicator
    document.querySelectorAll('.mobile-bottom-tab').forEach(btn => {
      if (btn.id === `mobile-tab-${tabId}`) {
        btn.classList.add('text-blue-600', 'font-bold');
        btn.classList.remove('text-slate-500');
      } else {
        btn.classList.remove('text-blue-600', 'font-bold');
        btn.classList.add('text-slate-500');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return true;
}
