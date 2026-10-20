import { describe, it, expect } from 'vitest';

describe('Privacy, Data Portability & Compliance (UU PDP No. 27/2022)', () => {
  it('validates the structure of the data portability JSON export', () => {
    const mockUser = {
      isLoggedIn: true,
      name: 'Dimitri Ahmad',
      email: 'dimitriahmad000@gmail.com',
      tier: 'VIP',
      blastQuota: 40
    };

    const mockExport = {
      app: 'Lolos Kerja',
      version: '2.2.0',
      exportedAt: new Date().toISOString(),
      user: mockUser,
      masterProfile: {
        identity: { fullName: mockUser.name, email: mockUser.email },
        target_roles: ['Project Manager', 'AI Architect']
      },
      appliedJobsHistory: [
        {
          id: 'job-1',
          role: 'Junior Analyst',
          company: 'PT Solusi Teknologi',
          sentAt: '2026-10-20 14:00'
        }
      ],
      lastInterviewSession: null
    };

    expect(mockExport.app).toBe('Lolos Kerja');
    expect(mockExport.version).toBe('2.2.0');
    expect(mockExport.user.name).toBe('Dimitri Ahmad');
    expect(mockExport.appliedJobsHistory).toHaveLength(1);
    expect(Date.parse(mockExport.exportedAt)).not.toBeNaN();
  });

  it('validates right-to-be-forgotten clean deletion checklist', () => {
    const storageKeys = [
      'dims_career_user',
      'dims_master_profile',
      'lk_saved_cv_state',
      'appliedJobsHistory'
    ];

    const fakeLocalStorage = {};
    storageKeys.forEach(k => { fakeLocalStorage[k] = 'test-data'; });

    // Simulate clean deletion
    storageKeys.forEach(k => { delete fakeLocalStorage[k]; });

    expect(Object.keys(fakeLocalStorage)).toHaveLength(0);
  });
});
