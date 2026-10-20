/**
 * auth.js: Supabase JWT Verification & Session Extraction
 * Enforces server-side authentication, role authorization, and tenant isolation.
 * Node.js ESM format
 */

import { createClient } from '@supabase/supabase-js';
import { getEffectiveTier } from './quota.js';

let cachedAdminClient = null;

/**
 * Singleton instance of Supabase Admin Client (using service_role key)
 */
export function getSupabaseAdmin() {
  if (cachedAdminClient) return cachedAdminClient;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di environment server');
  }

  cachedAdminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return cachedAdminClient;
}

/**
 * Ekstraksi Bearer token dari header Authorization
 */
export function extractBearerToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;

  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Memverifikasi JWT Supabase dan mengambil data profil pengguna secara lengkap
 *
 * @param {Object} req - HTTP request
 * @returns {Promise<{ user: Object, profile: Object, effectiveTier: string } | null>}
 */
export async function verifyAuth(req) {
  const token = extractBearerToken(req);
  if (!token) return null;

  const supabase = getSupabaseAdmin();

  // Verifikasi JWT token via Supabase Auth
  const { data: authData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !authData?.user) {
    return null;
  }

  const user = authData.user;

  // Ambil profil terkini dari tabel public.profiles
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    // Fallback minimal jika record profile belum tersinkronisasi
    const fallbackProfile = {
      id: user.id,
      email: user.email,
      role: 'user',
      tier: 'FREE',
      daily_blast_limit: 0,
      blast_credits: 0,
      free_cv_analyses_left: 1,
      free_interviews_left: 2
    };
    return {
      user,
      profile: fallbackProfile,
      effectiveTier: 'FREE'
    };
  }

  const effectiveTier = getEffectiveTier(profile);

  return {
    user,
    profile,
    effectiveTier
  };
}

/**
 * Middleware helper: Mewajibkan autentikasi pengguna
 */
export async function requireAuth(req, res) {
  const authSession = await verifyAuth(req);
  if (!authSession) {
    res.status(401).json({
      error: 'Autentikasi diperlukan. Sesi Anda tidak valid atau telah kedaluwarsa.'
    });
    return null;
  }
  return authSession;
}

/**
 * Middleware helper: Mewajibkan akses Admin atau Owner
 */
export async function requireAdmin(req, res) {
  const authSession = await requireAuth(req, res);
  if (!authSession) return null;

  const role = authSession.profile?.role;
  if (role !== 'admin' && role !== 'owner') {
    res.status(403).json({
      error: 'Akses ditolak. Fitur ini hanya diperuntukkan bagi Administrator.'
    });
    return null;
  }

  return authSession;
}
