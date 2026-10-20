import { describe, it, expect } from 'vitest';
import { TIER_LIMITS, TIER_LABELS, getTierLimits, isFeatureAllowed } from '../../api/_lib/limits.js';
import { getEffectiveTier, checkQuota } from '../../api/_lib/quota.js';

describe('TIER_LIMITS & TIER_LABELS (Lampiran A)', () => {
  it('defines 4 canonical tiers with correct pricing and blast limits', () => {
    expect(TIER_LIMITS.FREE.priceIdr).toBe(0);
    expect(TIER_LIMITS.FREE.dailyBlastLimit).toBe(0);
    expect(TIER_LIMITS.FREE.exportPdfWatermark).toBe(true);

    expect(TIER_LIMITS.FLASH.priceIdr).toBe(9999);
    expect(TIER_LIMITS.FLASH.durationDays).toBe(1);
    expect(TIER_LIMITS.FLASH.dailyBlastLimit).toBe(10);
    expect(TIER_LIMITS.FLASH.exportPdfWatermark).toBe(false);

    expect(TIER_LIMITS.DIBANTUIN.priceIdr).toBe(49000);
    expect(TIER_LIMITS.DIBANTUIN.durationDays).toBe(30);
    expect(TIER_LIMITS.DIBANTUIN.dailyBlastLimit).toBe(10);
    expect(TIER_LIMITS.DIBANTUIN.autoDailyQueue).toBe(true);

    expect(TIER_LIMITS.VIP.priceIdr).toBe(149000);
    expect(TIER_LIMITS.VIP.durationDays).toBe(30);
    expect(TIER_LIMITS.VIP.dailyBlastLimit).toBe(40);
    expect(TIER_LIMITS.VIP.autoDailyQueue).toBe(true);
  });

  it('standardizes Indonesian tier labels without marketing jargon', () => {
    expect(TIER_LABELS.FREE).toBe('Gratis');
    expect(TIER_LABELS.FLASH).toBe('Paket 24 Jam');
    expect(TIER_LABELS.DIBANTUIN).toBe('Dibantuin');
    expect(TIER_LABELS.VIP).toBe('Dikerjain VIP');
  });

  it('falls back safely to FREE for unknown tiers', () => {
    expect(getTierLimits('UNKNOWN')).toEqual(TIER_LIMITS.FREE);
    expect(getTierLimits(null)).toEqual(TIER_LIMITS.FREE);
  });

  it('evaluates isFeatureAllowed accurately across tiers', () => {
    expect(isFeatureAllowed('FREE', 'auto_blast')).toBe(false);
    expect(isFeatureAllowed('FLASH', 'auto_blast')).toBe(true);
    expect(isFeatureAllowed('VIP', 'auto_blast')).toBe(true);
    expect(isFeatureAllowed('FREE', 'clean_pdf_export')).toBe(false);
    expect(isFeatureAllowed('VIP', 'clean_pdf_export')).toBe(true);
  });
});

describe('getEffectiveTier & checkQuota', () => {
  it('returns FREE if profile is null or tier is FREE', () => {
    expect(getEffectiveTier(null)).toBe('FREE');
    expect(getEffectiveTier({ tier: 'FREE' })).toBe('FREE');
  });

  it('respects active tier before expiration date', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    expect(getEffectiveTier({ tier: 'VIP', tier_expires_at: futureDate })).toBe('VIP');
    expect(getEffectiveTier({ tier: 'FLASH', tier_expires_at: futureDate })).toBe('FLASH');
  });

  it('automatically downgrades expired tier to FREE', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    expect(getEffectiveTier({ tier: 'VIP', tier_expires_at: pastDate })).toBe('FREE');
    expect(getEffectiveTier({ tier: 'FLASH', tier_expires_at: pastDate })).toBe('FREE');
  });

  it('blocks FREE tier from auto-blast', () => {
    const res = checkQuota({ tier: 'FREE' }, 'blast');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Fitur Auto-Blast email hanya tersedia untuk pengguna paket berbayar');
  });

  it('allows VIP tier to blast if within quota', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = checkQuota({
      tier: 'VIP',
      tier_expires_at: futureDate,
      daily_blasts_sent_today: 5
    }, 'blast');
    expect(res.allowed).toBe(true);
  });

  it('enforces FREE quota counters for CV analysis and interview sessions', () => {
    const freshUser = { tier: 'FREE', free_cv_analyses_left: 1, free_interviews_left: 2 };
    expect(checkQuota(freshUser, 'cv_analysis').allowed).toBe(true);
    expect(checkQuota(freshUser, 'interview').allowed).toBe(true);

    const exhaustedUser = { tier: 'FREE', free_cv_analyses_left: 0, free_interviews_left: 0 };
    expect(checkQuota(exhaustedUser, 'cv_analysis').allowed).toBe(false);
    expect(checkQuota(exhaustedUser, 'interview').allowed).toBe(false);
  });
});
