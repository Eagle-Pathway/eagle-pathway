import { describe, it, expect, beforeEach, vi } from 'vitest';

// Hoisted so the mock object exists when vi.mock factories run.
const { mockSupabase, mockReadAsString } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
  mockReadAsString: vi.fn(),
}));

vi.mock('./supabase', () => ({ supabase: mockSupabase }));
vi.mock('expo-file-system/legacy', () => ({ readAsStringAsync: mockReadAsString }));
vi.mock('base64-arraybuffer', () => ({ decode: (s: string) => `decoded:${s}` }));

import { paymentsService } from './payments';

const BASE_PARAMS = {
  userId: 'user-1',
  referenceId: 'app-1',
  paymentType: 'scholarship_package' as const,
  method: 'telebirr' as const,
  amount: 5000,
  transactionId: 'TXN-123',
  fileUri: 'file:///tmp/receipt.png',
  fileName: 'receipt.png',
};

function mockStorage({
  uploadError = null,
  signedUrl = 'https://signed/receipt',
  signedError = null,
}: {
  uploadError?: { message: string } | null;
  signedUrl?: string;
  signedError?: { message: string } | null;
} = {}) {
  const upload = vi.fn().mockResolvedValue({ error: uploadError });
  const createSignedUrl = vi.fn().mockResolvedValue({
    data: signedUrl ? { signedUrl } : null,
    error: signedError,
  });
  (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({ upload, createSignedUrl });
  return { upload, createSignedUrl };
}

function mockPaymentsInsert({
  data = { id: 'pay-1' },
  error = null,
}: { data?: { id: string } | null; error?: { message: string } | null } = {}) {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data, error }),
    }),
  });
  (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });
  return insert;
}

describe('paymentsService.submitPaymentReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadAsString.mockResolvedValue('BASE64DATA');
  });

  it('uploads the receipt, signs it, and inserts a pending payment record', async () => {
    const { upload, createSignedUrl } = mockStorage({ signedUrl: 'https://signed/receipt.png' });
    const insert = mockPaymentsInsert({ data: { id: 'pay-1' } });

    const result = await paymentsService.submitPaymentReceipt(BASE_PARAMS);

    expect(result).toEqual({ id: 'pay-1' });
    expect(upload).toHaveBeenCalledWith(
      expect.stringContaining('user-1/'),
      'decoded:BASE64DATA',
      { contentType: 'image/png', upsert: true },
    );
    expect(createSignedUrl).toHaveBeenCalledWith(expect.stringContaining('user-1/'), 3600);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        amount: 5000,
        transaction_id: 'TXN-123',
        method: 'telebirr',
        status: 'pending',
        receipt_url: 'https://signed/receipt.png',
      }),
    );
  });

  it('throws (and never inserts) when the receipt upload fails', async () => {
    mockStorage({ uploadError: { message: 'bucket down' } });
    const insert = mockPaymentsInsert();

    await expect(paymentsService.submitPaymentReceipt(BASE_PARAMS)).rejects.toThrow(
      /Failed to upload receipt image/,
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it('throws when the signed URL cannot be created', async () => {
    mockStorage({ signedUrl: '', signedError: { message: 'sign fail' } });
    const insert = mockPaymentsInsert();

    await expect(paymentsService.submitPaymentReceipt(BASE_PARAMS)).rejects.toThrow(
      /Failed to secure receipt preview/,
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it('throws when the payment record insert fails', async () => {
    mockStorage();
    mockPaymentsInsert({ data: null, error: { message: 'duplicate txn' } });

    await expect(paymentsService.submitPaymentReceipt(BASE_PARAMS)).rejects.toThrow(
      /Failed to submit payment record/,
    );
  });
});
