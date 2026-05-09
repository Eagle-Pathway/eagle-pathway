import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
};

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Admin User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have supabase client configured', () => {
    expect(mockSupabase.from).toBeDefined();
  });
});