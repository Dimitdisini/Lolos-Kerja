/**
 * /api/config.js: Public Application & Tier Limits Configuration Endpoint
 * Exposes TIER_LIMITS and TIER_LABELS as the single source of truth for frontend pricing & gates.
 * Node.js ESM format
 */

import { TIER_LIMITS, TIER_LABELS } from './_lib/limits.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({
    brand: 'Lolos Kerja',
    tagline: 'AI Career Copilot untuk Fresh Graduate Indonesia',
    version: '2.3.0',
    tiers: TIER_LIMITS,
    tierLabels: TIER_LABELS
  });
}
