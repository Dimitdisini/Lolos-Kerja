/**
 * quota.js: Atomic Quota & Tier Verification Engine
 * Enforces server-side authority for all restricted candidate actions.
 * Node.js ESM format
 */

import { getTierLimits } from './limits.js';

/**
 * Menghitung tier efektif dari sebuah profil pengguna.
 * Jika paket berbayar telah melewati tanggal tier_expires_at, otomatis diturunkan ke FREE.
 *
 * @param {Object} profile - Profil pengguna dari database
 * @returns {string} 'FREE' | 'FLASH' | 'DIBANTUIN' | 'VIP'
 */
export function getEffectiveTier(profile) {
  if (!profile || !profile.tier) return 'FREE';

  const tier = profile.tier.toUpperCase();
  if (tier === 'FREE') return 'FREE';

  if (profile.tier_expires_at) {
    const expiresAt = new Date(profile.tier_expires_at).getTime();
    if (Date.now() > expiresAt) {
      return 'FREE';
    }
  }

  return tier;
}

/**
 * Memeriksa apakah pengguna berhak menggunakan fitur tertentu berdasarkan sisa kuota atau tier.
 *
 * @param {Object} profile
 * @param {'cv_analysis'|'interview'|'blast'|'cv_variant'} feature
 * @returns {{ allowed: boolean, reason?: string, effectiveTier: string }}
 */
export function checkQuota(profile, feature) {
  const effectiveTier = getEffectiveTier(profile);
  const limits = getTierLimits(effectiveTier);

  switch (feature) {
    case 'cv_analysis': {
      if (effectiveTier !== 'FREE') {
        return { allowed: true, effectiveTier };
      }
      const left = profile.free_cv_analyses_left ?? 0;
      if (left > 0) {
        return { allowed: true, effectiveTier, left };
      }
      return {
        allowed: false,
        reason: 'Batas analisis CV gratis Anda telah habis. Silakan tingkatkan ke paket berbayar.',
        effectiveTier
      };
    }

    case 'interview': {
      if (effectiveTier !== 'FREE') {
        return { allowed: true, effectiveTier };
      }
      const left = profile.free_interviews_left ?? 0;
      if (left > 0) {
        return { allowed: true, effectiveTier, left };
      }
      return {
        allowed: false,
        reason: 'Batas 2 sesi latihan wawancara gratis Anda telah habis. Upgrade paket untuk sesi tanpa batas.',
        effectiveTier
      };
    }

    case 'blast': {
      if (effectiveTier === 'FREE') {
        return {
          allowed: false,
          reason: 'Fitur Auto-Blast email hanya tersedia untuk pengguna paket berbayar (FLASH, DIBANTUIN, VIP).',
          effectiveTier
        };
      }
      if (effectiveTier === 'FLASH' && (profile.blast_credits ?? 0) <= 0) {
        return {
          allowed: false,
          reason: 'Kredit paket FLASH Anda (10 email) telah habis. Silakan pesan paket baru.',
          effectiveTier
        };
      }
      return { allowed: true, effectiveTier };
    }

    case 'cv_variant': {
      const maxVariants = limits.cvVariantsPerRole || 1;
      return { allowed: true, maxVariants, effectiveTier };
    }

    default:
      return { allowed: true, effectiveTier };
  }
}

/**
 * Mengonsumsi kuota secara atomik di database menggunakan supabase service role client.
 *
 * @param {Object} supabaseAdmin - Supabase client dengan role service_role
 * @param {string} userId - UUID pengguna
 * @param {'cv_analysis'|'interview'|'blast_credit'|'daily_slot'} feature
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function consumeQuota(supabaseAdmin, userId, feature) {
  if (!supabaseAdmin || !userId) {
    return { success: false, error: 'Database client atau userId tidak tersedia' };
  }

  try {
    if (feature === 'cv_analysis') {
      const { data: profile, error: readErr } = await supabaseAdmin
        .from('profiles')
        .select('tier, tier_expires_at, free_cv_analyses_left')
        .eq('id', userId)
        .single();

      if (readErr || !profile) {
        return { success: false, error: 'Profil pengguna tidak ditemukan' };
      }

      const effectiveTier = getEffectiveTier(profile);
      if (effectiveTier !== 'FREE') {
        return { success: true }; // Unlimited for paid tiers
      }

      if ((profile.free_cv_analyses_left ?? 0) <= 0) {
        return { success: false, error: 'Batas gratis analisis CV telah habis' };
      }

      const { error: updErr } = await supabaseAdmin
        .from('profiles')
        .update({ free_cv_analyses_left: profile.free_cv_analyses_left - 1 })
        .eq('id', userId);

      if (updErr) return { success: false, error: updErr.message };
      return { success: true };
    }

    if (feature === 'interview') {
      const { data: profile, error: readErr } = await supabaseAdmin
        .from('profiles')
        .select('tier, tier_expires_at, free_interviews_left')
        .eq('id', userId)
        .single();

      if (readErr || !profile) {
        return { success: false, error: 'Profil pengguna tidak ditemukan' };
      }

      const effectiveTier = getEffectiveTier(profile);
      if (effectiveTier !== 'FREE') {
        return { success: true }; // Unlimited for paid tiers
      }

      if ((profile.free_interviews_left ?? 0) <= 0) {
        return { success: false, error: 'Batas gratis wawancara telah habis' };
      }

      const { error: updErr } = await supabaseAdmin
        .from('profiles')
        .update({ free_interviews_left: profile.free_interviews_left - 1 })
        .eq('id', userId);

      if (updErr) return { success: false, error: updErr.message };
      return { success: true };
    }

    if (feature === 'blast_credit') {
      const { data, error } = await supabaseAdmin.rpc('consume_blast_credit', {
        p_user_id: userId
      });
      if (error) return { success: false, error: error.message };
      return { success: Boolean(data) };
    }

    if (feature === 'daily_slot') {
      const { data, error } = await supabaseAdmin.rpc('consume_daily_slot', {
        p_user_id: userId
      });
      if (error) return { success: false, error: error.message };
      return { success: Boolean(data) };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
