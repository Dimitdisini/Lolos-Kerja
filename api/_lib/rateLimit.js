/**
 * rateLimit.js: Serverless Rate Limiting Guard
 * Protects endpoints from abuse using sliding-window tracking per IP/User.
 * Supports persistent PostgreSQL table public.rate_limits (B4) with fast memory fallback.
 * Node.js ESM format
 */

import { getSupabaseAdmin } from './auth.js';

// In-memory rate limiting map for quick fallback or test runs
const memoryStore = new Map();
const CLEANUP_INTERVAL_MS = 60000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Ekstraksi identifier klien (User ID jika login, atau IP publik)
 */
export function getClientIdentifier(req, userId = null) {
  if (userId) return `user:${userId}`;

  const headers = req.headers || {};
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return `ip:${ip}`;
  }

  const realIp = headers['x-real-ip'];
  if (realIp) return `ip:${realIp}`;

  return req.socket?.remoteAddress ? `ip:${req.socket.remoteAddress}` : 'ip:unknown';
}

/**
 * Memeriksa dan memberlakukan rate limit secara sinkron (memori).
 */
export function checkRateLimit(req, {
  maxRequests = 30,
  windowMs = 60000,
  userId = null
} = {}) {
  cleanupExpired();

  const clientId = getClientIdentifier(req, userId);
  const now = Date.now();

  let record = memoryStore.get(clientId);

  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + windowMs
    };
    memoryStore.set(clientId, record);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: Math.ceil(windowMs / 1000)
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds
    };
  }

  return {
    allowed: true,
    remaining,
    resetInSeconds
  };
}

/**
 * Memeriksa rate limit persisten menggunakan tabel PostgreSQL public.rate_limits (B4)
 */
export async function checkRateLimitDb(req, {
  maxRequests = 30,
  windowMs = 60000,
  userId = null
} = {}) {
  const clientId = getClientIdentifier(req, userId);
  const now = new Date();
  const windowStartThreshold = new Date(Date.now() - windowMs).toISOString();

  try {
    const supabase = getSupabaseAdmin();
    // 1. Ambil atau buat record
    const { data: record, error: fetchError } = await supabase
      .from('rate_limits')
      .select('key, window_start, hits')
      .eq('key', clientId)
      .maybeSingle();

    if (fetchError || !record) {
      // Masukkan baris baru
      await supabase
        .from('rate_limits')
        .upsert({ key: clientId, window_start: now.toISOString(), hits: 1 });
      return { allowed: true, remaining: maxRequests - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
    }

    // Jika window sudah lewat, reset window
    if (new Date(record.window_start).getTime() < Date.now() - windowMs) {
      await supabase
        .from('rate_limits')
        .update({ window_start: now.toISOString(), hits: 1 })
        .eq('key', clientId);
      return { allowed: true, remaining: maxRequests - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
    }

    // Hitung hits saat ini
    const nextHits = record.hits + 1;
    await supabase
      .from('rate_limits')
      .update({ hits: nextHits })
      .eq('key', clientId);

    const remaining = Math.max(0, maxRequests - nextHits);
    const windowStartMs = new Date(record.window_start).getTime();
    const resetInSeconds = Math.max(1, Math.ceil((windowStartMs + windowMs - Date.now()) / 1000));

    return {
      allowed: nextHits <= maxRequests,
      remaining,
      resetInSeconds
    };
  } catch (err) {
    // Fallback aman ke in-memory jika DB belum terhubung
    return checkRateLimit(req, { maxRequests, windowMs, userId });
  }
}

/**
 * Helper middleware untuk endpoint Vercel Serverless
 */
export function applyRateLimit(req, res, options = {}) {
  const result = checkRateLimit(req, options);

  res.setHeader('X-RateLimit-Limit', options.maxRequests || 30);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetInSeconds);

  if (!result.allowed) {
    res.setHeader('Retry-After', result.resetInSeconds);
    res.status(429).json({
      error: 'Terlalu banyak permintaan (Rate Limit Exceeded). Silakan coba lagi dalam beberapa saat.',
      retryAfterSeconds: result.resetInSeconds
    });
    return false;
  }

  return true;
}
