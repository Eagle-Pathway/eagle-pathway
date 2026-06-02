import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: { from: vi.fn() },
}));

vi.mock('./supabase', () => ({ supabase: mockSupabase }));

import { financeService } from './finance';

describe('financeService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('requestPayout', () => {
    const params = {
      tutorId: 'tutor-1',
      amount: 1200,
      bankName: 'CBE',
      accountNumber: '1000123456789',
      accountName: 'Test Tutor',
    };

    it('inserts a pending payout and returns the record', async () => {
      const insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'payout-1', status: 'pending' }, error: null }),
        }),
      });
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });

      const result = await financeService.requestPayout(params);

      expect(result).toEqual({ id: 'payout-1', status: 'pending' });
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tutor_id: 'tutor-1',
          amount: 1200,
          bank_name: 'CBE',
          account_number: '1000123456789',
          status: 'pending',
        }),
      );
    });

    it('throws when the insert errors', async () => {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insufficient balance' } }),
          }),
        }),
      });

      await expect(financeService.requestPayout(params)).rejects.toMatchObject({
        message: 'insufficient balance',
      });
    });
  });

  describe('getTutorPayouts', () => {
    it('returns payouts scoped to the tutor user', async () => {
      const order = vi.fn().mockResolvedValue({ data: [{ id: 'payout-1' }], error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });

      const result = await financeService.getTutorPayouts('user-1');

      expect(result).toEqual([{ id: 'payout-1' }]);
      expect(eq).toHaveBeenCalledWith('tutor.user_id', 'user-1');
    });

    it('throws when the query errors', async () => {
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'rls denied' } }),
          }),
        }),
      });

      await expect(financeService.getTutorPayouts('user-1')).rejects.toMatchObject({
        message: 'rls denied',
      });
    });
  });
});
