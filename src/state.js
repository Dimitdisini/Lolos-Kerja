/**
 * src/state.js: Centralized Reactive State Store
 * Single source of truth for user profile, master CV profile, and active UI navigation.
 */

export const appState = {
  currentTab: 'home-module',
  user: {
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
  },
  masterProfile: null,
  activeCvDoc: null,
  activeCvVariant: null,
  appliedJobsHistory: [],
  lastInterviewSession: null,
  blastQueue: [],
  config: null
};

/**
 * Menyimpan sesi pengguna ke localStorage
 */
export function persistUserState() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('lolos_kerja_user', JSON.stringify(appState.user));
    if (appState.masterProfile) {
      localStorage.setItem('dims_master_profile', JSON.stringify(appState.masterProfile));
    }
  }
}

/**
 * Memuat sesi pengguna dari localStorage
 */
export function loadPersistedState() {
  if (typeof localStorage === 'undefined') return;
  try {
    const savedUser = localStorage.getItem('lolos_kerja_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      appState.user = { ...appState.user, ...parsed };
    }
    const savedProfile = localStorage.getItem('dims_master_profile');
    if (savedProfile) {
      appState.masterProfile = JSON.parse(savedProfile);
    }
    const savedHistory = localStorage.getItem('appliedJobsHistory');
    if (savedHistory) {
      appState.appliedJobsHistory = JSON.parse(savedHistory);
    }
  } catch (err) {
    console.warn('[STATE] Failed to restore persisted state:', err);
  }
}
