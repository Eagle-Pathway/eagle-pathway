import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.mock is hoisted above top-level declarations, so the mock object
// must be created inside vi.hoisted() to exist when the factory runs.
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
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
  },
}));

vi.mock('./supabase', () => ({
  supabase: mockSupabase,
}));

// expo-document-picker pulls in react-native, whose Flow syntax the test
// transformer cannot parse. The service only uses its types here.
vi.mock('expo-document-picker', () => ({}));

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
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      // The query builder is chainable: eq() -> builder, ilike() -> builder, order() resolves.
      const builder: any = { order: mockOrder };
      builder.ilike = vi.fn().mockReturnValue(builder);

      mockFrom.mockReturnValue({
        select: () => ({ eq: () => builder }),
      });

      await scholarshipsService.getScholarships({ search: 'test' });
      expect(builder.ilike).toHaveBeenCalled();
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

      // from() is called twice: applications (insert chain) then documents (update chain).
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockApplication, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ data: null, error: null }),
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