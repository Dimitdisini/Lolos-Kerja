/**
 * api/_lib/env.js: Strict Environment Variable Validation
 * Throws explicit error at runtime start if essential variables are missing in production.
 * Node.js ESM format
 */

export function validateEnv(options = {}) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const requireCron = options.requireCron ?? false;

  const missing = [];

  if (isProd) {
    if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!process.env.APP_URL) missing.push('APP_URL');
  }

  if (requireCron || isProd) {
    if (!process.env.CRON_SECRET || process.env.CRON_SECRET.trim().length === 0) {
      missing.push('CRON_SECRET (wajib diisi untuk memproteksi endpoint internal/cron)');
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[FATAL] Konfigurasi environment tidak lengkap: ${missing.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    APP_URL: process.env.APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    MAIL_TRANSPORT: process.env.MAIL_TRANSPORT || 'resend',
    LLM_MODE: process.env.LLM_MODE || 'live'
  };
}
