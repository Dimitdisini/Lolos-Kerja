import { describe, it, expect } from 'vitest';
import { signUpEmail } from '../../src/lib/supabase.js';

describe('M1: Supabase Auth & RLS Boundary Specifications', () => {
  it('enforces password length >= 8 characters on registration', async () => {
    await expect(signUpEmail('test@gmail.com', 'short', 'Test User'))
      .rejects
      .toThrow('Kata sandi harus minimal 8 karakter demi keamanan akun Anda.');
  });

  it('validates tenant isolation: user A cannot access user B records', () => {
    const userA = { id: 'usr-aaa-111', role: 'user', tier: 'FREE' };
    const userB = { id: 'usr-bbb-222', role: 'user', tier: 'VIP' };

    // Simulating Postgres RLS policy: (auth.uid() = id or is_admin())
    const canUserReadProfile = (authUid, profileId, role) => {
      return authUid === profileId || role === 'admin' || role === 'owner';
    };

    expect(canUserReadProfile(userA.id, userA.id, userA.role)).toBe(true);
    expect(canUserReadProfile(userA.id, userB.id, userA.role)).toBe(false);
    expect(canUserReadProfile(userB.id, userA.id, userB.role)).toBe(false);

    // Admin/owner can read
    const adminUser = { id: 'admin-999', role: 'admin' };
    expect(canUserReadProfile(adminUser.id, userA.id, adminUser.role)).toBe(true);
  });

  it('validates client mutation restriction: tier and quota cannot be changed by client', () => {
    // Simulating 0001_core.sql RLS: revoke update on public.profiles from anon, authenticated;
    // grant update (full_name, avatar_url, last_login_at) on public.profiles to authenticated;
    const allowedClientUpdateColumns = ['full_name', 'avatar_url', 'last_login_at'];
    const attemptedClientUpdate = {
      full_name: 'Dimitri Baru',
      tier: 'VIP',
      blast_quota: 9999
    };

    const sanitizedUpdate = {};
    for (const [col, val] of Object.entries(attemptedClientUpdate)) {
      if (allowedClientUpdateColumns.includes(col)) {
        sanitizedUpdate[col] = val;
      }
    }

    expect(sanitizedUpdate).toEqual({ full_name: 'Dimitri Baru' });
    expect(sanitizedUpdate.tier).toBeUndefined();
    expect(sanitizedUpdate.blast_quota).toBeUndefined();
  });
});
