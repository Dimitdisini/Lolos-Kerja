/**
 * src/lib/supabase.js: Client-Side Supabase Client (Auth + RLS-Read Only)
 * Enforces strict security boundary: browser only manages auth session and reads own profile.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration from build env or runtime window object
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) 
  || (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_URL)
  || 'https://lolos-kerja-supabase.co';

const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)
  || (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_ANON_KEY)
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    transport: typeof WebSocket !== 'undefined' ? WebSocket : class DummyWebSocket {}
  }
});

/**
 * Daftar akun baru dengan email dan password (minimal 8 karakter)
 */
export async function signUpEmail(email, password, fullName) {
  if (!password || password.length < 8) {
    throw new Error('Kata sandi harus minimal 8 karakter demi keamanan akun Anda.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim()
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Masuk dengan email dan password
 */
export async function signInEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Masuk dengan Google OAuth resmi
 */
export async function signInGoogle() {
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Keluar / Logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Mengambil sesi aktif saat ini
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Mendengarkan perubahan status autentikasi
 */
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Mengambil profil kandidat milik sendiri dari tabel public.profiles via RLS
 */
export async function getMyProfile() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, tier, tier_expires_at, blast_quota, daily_blast_limit, created_at')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile via RLS:', error);
    return null;
  }

  return data;
}
