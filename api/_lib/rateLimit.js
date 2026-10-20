/**
 * rateLimit.js: Serverless Rate Limiting Guard
 * Protects endpoints from abuse using sliding-window tracking per IP/User.
 * Node.js ESM format
 */

// In-memory rate limiting map for serverless execution context
const memoryStore = new Map();

// Periodically clean expired keys to prevent memory leak
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
 * Memeriksa dan memberlakukan rate limit.
 *
 * @param {Object} req - HTTP request object
 * @param {Object} [options]
 * @param {number} [options.maxRequests=30] - Maksimal request per window
 * @param {number} [options.windowMs=60000] - Window waktu dalam milidetik (default 1 menit)
 * @param {string} [options.userId=null] - Optional authenticated user ID
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number }}
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
 * Helper middleware untuk endpoint Vercel Serverless
 */
export function applyRateLimit(req, res, options = {}) {
  const result = checkRateLimit(req, options);

  res.setHeader('X-RateLimit-Limit', options.maxRequests || 30);
  res.setHeader('X-RateLimit-Remaining', result.remaining);

  if (!result.allowed) {
    res.setHeader('Retry-After', result.resetInSeconds);
    res.status(429).json({
      error: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.',
      retryAfterSeconds: result.resetInSeconds
    });
    return false;
  }

  return true;
}
