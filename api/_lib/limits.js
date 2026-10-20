/**
 * limits.js: Single Source of Truth for Tier Limits & Features
 * Aligned with Lampiran A ANTIGRAVITY-SPRINT-PLAN.md
 * Node.js ESM format
 */

export const TIER_LIMITS = {
  FREE: {
    tier: 'FREE',
    label: 'Gratis',
    priceIdr: 0,
    durationDays: 0,
    cvAnalyses: 1,
    exportPdfWatermark: true,
    cvVariantsPerRole: 1,
    interviewSessions: 2,
    jobMatchScore: 'dasar', // 'dasar' | 'lengkap'
    dailyBlastLimit: 0,
    maxTotalBlastCredits: 0,
    autoDailyQueue: false,
    replyBounceReport: false
  },
  FLASH: {
    tier: 'FLASH',
    label: 'Paket 24 Jam',
    priceIdr: 9999,
    durationDays: 1, // 24 jam
    cvAnalyses: Infinity,
    exportPdfWatermark: false,
    cvVariantsPerRole: 2,
    interviewSessions: Infinity,
    jobMatchScore: 'lengkap',
    dailyBlastLimit: 10,
    maxTotalBlastCredits: 10,
    autoDailyQueue: false,
    replyBounceReport: 'dasar'
  },
  DIBANTUIN: {
    tier: 'DIBANTUIN',
    label: 'Dibantuin',
    priceIdr: 49000,
    durationDays: 30, // 30 hari
    cvAnalyses: Infinity,
    exportPdfWatermark: false,
    cvVariantsPerRole: 3,
    interviewSessions: Infinity,
    jobMatchScore: 'lengkap',
    dailyBlastLimit: 10,
    maxTotalBlastCredits: 300,
    autoDailyQueue: true,
    replyBounceReport: 'lengkap'
  },
  VIP: {
    tier: 'VIP',
    label: 'Dikerjain VIP',
    priceIdr: 149000,
    durationDays: 30, // 30 hari
    cvAnalyses: Infinity,
    exportPdfWatermark: false,
    cvVariantsPerRole: 5,
    interviewSessions: Infinity,
    jobMatchScore: 'lengkap_alasan',
    dailyBlastLimit: 40,
    maxTotalBlastCredits: 1200,
    autoDailyQueue: true,
    replyBounceReport: 'lengkap'
  }
};

export const TIER_LABELS = {
  FREE: 'Gratis',
  FLASH: 'Paket 24 Jam',
  DIBANTUIN: 'Dibantuin',
  VIP: 'Dikerjain VIP'
};

/**
 * Mendapatkan batas dan fitur untuk tier tertentu.
 * Jika tier tidak dikenal, default ke FREE.
 */
export function getTierLimits(tier) {
  const normalized = (tier || 'FREE').toUpperCase();
  return TIER_LIMITS[normalized] || TIER_LIMITS.FREE;
}

/**
 * Memeriksa apakah fitur diizinkan untuk tier tertentu.
 */
export function isFeatureAllowed(tier, featureName) {
  const limits = getTierLimits(tier);
  switch (featureName) {
    case 'auto_blast':
      return limits.dailyBlastLimit > 0;
    case 'auto_daily_queue':
      return !!limits.autoDailyQueue;
    case 'clean_pdf_export':
      return !limits.exportPdfWatermark;
    case 'unlimited_cv_analysis':
      return limits.cvAnalyses === Infinity;
    case 'unlimited_interview':
      return limits.interviewSessions === Infinity;
    case 'detailed_reasons':
      return limits.jobMatchScore === 'lengkap_alasan';
    default:
      return Boolean(limits[featureName]);
  }
}
