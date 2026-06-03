import { supabase } from './supabase';

export type RecommendationStatus = 'requested' | 'received' | 'declined';

export interface RecommendationRequest {
  id: string;
  student_id: string;
  referee_name: string;
  referee_email?: string | null;
  referee_phone?: string | null;
  relationship?: string | null;
  status: RecommendationStatus;
  notes?: string | null;
  document_id?: string | null;
  created_at: string;
  received_at?: string | null;
}

export const recommendationsService = {
  async list(studentId: string): Promise<RecommendationRequest[]> {
    const { data, error } = await supabase
      .from('recommendation_requests')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as RecommendationRequest[];
  },

  async create(params: {
    studentId: string;
    refereeName: string;
    refereeEmail?: string;
    refereePhone?: string;
    relationship?: string;
  }): Promise<RecommendationRequest> {
    const { data, error } = await supabase
      .from('recommendation_requests')
      .insert({
        student_id: params.studentId,
        referee_name: params.refereeName.trim(),
        referee_email: params.refereeEmail?.trim() || null,
        referee_phone: params.refereePhone?.trim() || null,
        relationship: params.relationship?.trim() || null,
        status: 'requested',
      })
      .select()
      .single();
    if (error) throw error;
    return data as RecommendationRequest;
  },

  async updateStatus(id: string, status: RecommendationStatus): Promise<void> {
    const { error } = await supabase
      .from('recommendation_requests')
      .update({ status, received_at: status === 'received' ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('recommendation_requests').delete().eq('id', id);
    if (error) throw error;
  },
};
