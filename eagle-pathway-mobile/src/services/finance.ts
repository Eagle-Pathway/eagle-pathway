import { supabase } from './supabase';

export interface PayoutRequest {
  id: string;
  tutor_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
}

export const financeService = {
  async getTutorPayouts(tutorUserId: string): Promise<PayoutRequest[]> {
    // We join with tutors to filter by user_id
    const { data, error } = await supabase
      .from('tutor_payouts')
      .select('*, tutor:tutors!inner(user_id)')
      .eq('tutor.user_id', tutorUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
  },

  async requestPayout(params: {
    tutorId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }): Promise<PayoutRequest> {
    const { data, error } = await supabase
      .from('tutor_payouts')
      .insert({
        tutor_id: params.tutorId,
        amount: params.amount,
        bank_name: params.bankName,
        account_number: params.accountNumber,
        account_name: params.accountName,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data as PayoutRequest;
  },

  // Authoritative withdrawable balance — matches the payout-ceiling trigger.
  async getBalance(): Promise<{ earned: number; pledged: number; available: number }> {
    const { data, error } = await supabase.rpc('get_tutor_balance');
    if (error) throw error;
    return {
      earned: Number(data?.earned) || 0,
      pledged: Number(data?.pledged) || 0,
      available: Number(data?.available) || 0,
    };
  },
};
