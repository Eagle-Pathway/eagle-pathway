import { describe, it, expect, afterEach, vi } from 'vitest';

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

    it('throws when the insert fails (and never attaches orphan documents)', async () => {
      const documentsUpdate = vi.fn();
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'applications') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
              }),
            }),
          };
        }
        return { update: documentsUpdate };
      });

      await expect(
        scholarshipsService.createApplication({
          studentId: 'student-1',
          scholarshipId: 'schol-1',
          packageTier: 'basic',
        }),
      ).rejects.toMatchObject({ message: 'insert failed' });
      // The orphan-document attach step must not run if the application failed.
      expect(documentsUpdate).not.toHaveBeenCalled();
    });
  });

  describe('uploadDocument', () => {
    afterEach(() => vi.unstubAllGlobals());

    function stubFileFetch(size = 2048) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ blob: () => Promise.resolve({ size }) }),
      );
    }

    it('uploads the file, signs the URL, and persists a pending record', async () => {
      stubFileFetch(4096);
      const upload = vi.fn().mockResolvedValue({ error: null });
      const createSignedUrl = vi
        .fn()
        .mockResolvedValue({ data: { signedUrl: 'https://signed/doc.pdf' }, error: null });
      (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ upload, createSignedUrl });

      const insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'doc-1' }, error: null }),
        }),
      });
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const result = await scholarshipsService.uploadDocument({
        userId: 'user-1',
        documentType: 'transcript' as never,
        fileUri: 'file:///tmp/t.pdf',
        fileName: 'transcript.pdf',
      });

      expect(result).toEqual({ id: 'doc-1' });
      // PDF content type, no overwrite, path namespaced under the owner's id.
      expect(upload).toHaveBeenCalledWith(
        expect.stringContaining('user-1/transcript/'),
        expect.anything(),
        { contentType: 'application/pdf', upsert: false },
      );
      expect(createSignedUrl).toHaveBeenCalledWith(expect.stringContaining('user-1/transcript/'), 3600);
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          status: 'pending',
          file_url: 'https://signed/doc.pdf',
          file_size: 4096,
        }),
      );
    });

    it('throws and does not persist a record when the storage upload fails', async () => {
      stubFileFetch();
      const upload = vi.fn().mockResolvedValue({ error: { message: 'storage full' } });
      const createSignedUrl = vi.fn();
      (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ upload, createSignedUrl });
      const insert = vi.fn();
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      await expect(
        scholarshipsService.uploadDocument({
          userId: 'user-1',
          documentType: 'transcript' as never,
          fileUri: 'file:///tmp/t.pdf',
          fileName: 'transcript.pdf',
        }),
      ).rejects.toMatchObject({ message: 'storage full' });
      expect(createSignedUrl).not.toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
    });

    it('throws when the signed URL cannot be created', async () => {
      stubFileFetch();
      const upload = vi.fn().mockResolvedValue({ error: null });
      const createSignedUrl = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'sign failed' } });
      (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ upload, createSignedUrl });

      await expect(
        scholarshipsService.uploadDocument({
          userId: 'user-1',
          documentType: 'cv' as never,
          fileUri: 'file:///tmp/cv.jpg',
          fileName: 'cv.jpg',
        }),
      ).rejects.toMatchObject({ message: 'sign failed' });
    });
  });

  describe('getUserDocuments (signed URLs)', () => {
    function mockDocsQuery(docs: unknown[]) {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: docs, error: null }),
          }),
        }),
      });
    }

    it('replaces a stored file_path with a fresh signed URL', async () => {
      mockDocsQuery([{ id: 'd1', file_path: 'user-1/transcript/x.pdf', file_url: 'stale' }]);
      const createSignedUrl = vi
        .fn()
        .mockResolvedValue({ data: { signedUrl: 'https://signed/d1' }, error: null });
      (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ createSignedUrl });

      const [doc] = await scholarshipsService.getUserDocuments('user-1');
      expect(createSignedUrl).toHaveBeenCalledWith('user-1/transcript/x.pdf', 3600);
      expect(doc.file_url).toBe('https://signed/d1');
    });

    it('leaves an already-public http URL untouched and does not sign it', async () => {
      mockDocsQuery([{ id: 'd2', file_url: 'https://cdn.example.com/external.pdf' }]);
      const createSignedUrl = vi.fn();
      (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ createSignedUrl });

      const [doc] = await scholarshipsService.getUserDocuments('user-1');
      expect(createSignedUrl).not.toHaveBeenCalled();
      expect(doc.file_url).toBe('https://cdn.example.com/external.pdf');
    });

    it('falls back to the original document when signing fails', async () => {
      mockDocsQuery([{ id: 'd3', file_path: 'user-1/transcript/y.pdf', file_url: 'stale' }]);
      const createSignedUrl = vi.fn().mockResolvedValue({ data: null, error: { message: 'nope' } });
      (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ createSignedUrl });

      const [doc] = await scholarshipsService.getUserDocuments('user-1');
      expect(doc.file_url).toBe('stale');
    });
  });

  describe('updateApplicationStatus', () => {
    it('throws when the update errors', async () => {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'denied' } }),
        }),
      });

      await expect(
        scholarshipsService.updateApplicationStatus('app-1', 'submitted' as never),
      ).rejects.toMatchObject({ message: 'denied' });
    });
  });
});