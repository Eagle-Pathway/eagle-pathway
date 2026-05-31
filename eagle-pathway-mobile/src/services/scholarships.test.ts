import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
  })),
  auth: {
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      createSignedUrl: vi.fn(),
    })),
  },
};

vi.mock('./supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('../types', () => ({
  Scholarship: {},
  Application: {},
  Document: {},
  User: {},
}));

import { scholarshipsService } from './scholarships';

describe('scholarshipsService', () => {
  describe('getScholarships', () => {
    it('should fetch active scholarships', async () => {
      const mockData = [
        { id: '1', name: 'Test Scholarship', is_active: true },
      ];
      
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await scholarshipsService.getScholarships();
      expect(result).toEqual(mockData);
    });

    it('should apply search filter when provided', async () => {
      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockIlike = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      mockFrom.mockReturnValue({
        select: () => ({ eq: () => ({ ilike: () => ({ order: mockOrder }) }) }),
      });

      await scholarshipsService.getScholarships({ search: 'test' });
      expect(mockIlike).toHaveBeenCalled();
    });
  });

  describe('createApplication', () => {
    it('should create application with correct params', async () => {
      const mockApplication = {
        id: 'app-1',
        student_id: 'student-1',
        scholarship_id: 'schol-1',
        package_tier: 'premium',
        status: 'submitted',
      };

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockApplication, error: null }),
          }),
        }),
      });

      const result = await scholarshipsService.createApplication({
        studentId: 'student-1',
        scholarshipId: 'schol-1',
        packageTier: 'premium',
      });

      expect(result).toEqual(mockApplication);
    });
  });
});