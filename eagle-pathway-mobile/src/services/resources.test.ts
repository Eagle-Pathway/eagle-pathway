import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted above top-level declarations, so the mock object must be
// created inside vi.hoisted() to exist when the factory runs.
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}));

vi.mock('./supabase', () => ({ supabase: mockSupabase }));

import { resourcesService } from './resources';

// A chainable, awaitable query-builder stub: select/eq/in/order all return the
// builder, and awaiting it resolves to { data, error }. This mirrors the
// Supabase JS builder so the exact chain length doesn't matter.
function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  return builder;
}

describe('resourcesService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('returns published resources scoped to the role + "all"', async () => {
      const rows = [{ id: 'r1', title: 'SOP', audience: 'student' }];
      const builder = makeBuilder({ data: rows, error: null });
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      const result = await resourcesService.list('student');

      expect(mockSupabase.from).toHaveBeenCalledWith('resources');
      expect(builder.eq).toHaveBeenCalledWith('is_published', true);
      expect(builder.in).toHaveBeenCalledWith('audience', ['all', 'student']);
      expect(result).toEqual(rows);
    });

    it('passes the tutor role through to the audience filter', async () => {
      const builder = makeBuilder({ data: [], error: null });
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      await resourcesService.list('tutor');
      expect(builder.in).toHaveBeenCalledWith('audience', ['all', 'tutor']);
    });

    it('throws when the query errors', async () => {
      const builder = makeBuilder({ data: null, error: { message: 'boom' } });
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      await expect(resourcesService.list('parent')).rejects.toMatchObject({ message: 'boom' });
    });
  });

  describe('getFileUrl', () => {
    it('mints a signed URL for the stored path', async () => {
      const createSignedUrl = vi
        .fn()
        .mockResolvedValue({ data: { signedUrl: 'https://signed/x.pdf' }, error: null });
      (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ createSignedUrl });

      const url = await resourcesService.getFileUrl('guides/x.pdf');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('resources');
      expect(createSignedUrl).toHaveBeenCalledWith('guides/x.pdf', 3600);
      expect(url).toBe('https://signed/x.pdf');
    });

    it('returns null when signing fails', async () => {
      const createSignedUrl = vi.fn().mockResolvedValue({ data: null, error: { message: 'gone' } });
      (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ createSignedUrl });

      const url = await resourcesService.getFileUrl('guides/missing.pdf');
      expect(url).toBeNull();
    });
  });
});
