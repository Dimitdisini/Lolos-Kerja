/**
 * src/main.js: Application Client Entry Point (Vite / Browser)
 */

import './styles/main.css';
import { appState, loadPersistedState, persistUserState } from './state.js';
import { navigateTo } from './router.js';
import { showToast } from './components/toast.js';
import { showConfirmModal, closeConfirmModal } from './components/modal.js';
import { onAuthChange, getMyProfile, signOut } from './lib/supabase.js';
import { apiFetch, ensureAppAddressBanner } from './lib/api.js';

// 1. Initial State Restoration
loadPersistedState();
ensureAppAddressBanner();

// 2. Global Bindings for inline HTML handlers
if (typeof window !== 'undefined') {
  window.appState = appState;
  window.navigateTo = navigateTo;
  window.showToast = showToast;
  window.showConfirmModal = showConfirmModal;
  window.closeConfirmModal = closeConfirmModal;
  window.apiFetch = apiFetch;

  // Bridge switchTab to navigateTo
  window.switchTab = function(tabId) {
    return navigateTo(tabId);
  };

  // Auth Logout bridge
  window.logoutUser = async function() {
    try {
      await signOut();
    } catch (e) {
      // offline logout
    }
    appState.user = {
      isLoggedIn: false,
      id: null,
      name: 'Kandidat Pelamar',
      email: 'kandidat@gmail.com',
      role: 'user',
      tier: 'FREE',
      blastQuota: 10,
      dailyBlastLimit: 0,
      tier_expires_at: null,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
    };
    persistUserState();
    showToast('Anda telah berhasil keluar dari akun.', 'info');
    navigateTo('home-module');
  };
}

// 3. Supabase Auth State Listener
try {
  onAuthChange(async (event, session) => {
    if (session?.user) {
      const profile = await getMyProfile();
      appState.user = {
        isLoggedIn: true,
        id: session.user.id,
        email: session.user.email,
        name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email.split('@')[0],
        role: profile?.role || 'user',
        tier: profile?.tier || 'FREE',
        blastQuota: profile?.blast_quota ?? 10,
        dailyBlastLimit: profile?.daily_blast_limit ?? 0,
        tier_expires_at: profile?.tier_expires_at || null,
        avatar: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
      };
      persistUserState();
    }
  });
} catch (authInitErr) {
  console.warn('[AUTH] Auth listener initialization notice:', authInitErr);
}

console.log('[APP] Lolos Kerja client initialized.');
