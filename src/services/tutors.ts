import { supabase } from './supabase';
import { Tutor, TutorReview, Booking, SessionType } from '../types';

export const tutorsService = {
  async getTutors(filters?: {
    subject?: string;
    gradeLevel?: string;
    isOnline?: boolean;
    isInPerson?: boolean;
    maxRate?: number;
    search?: string;
  }): Promise<Tutor[]> {
    let query = supabase
      .from('tutors')
      .select('*, user:users(*)')
      .eq('is_verified', true);

    if (filters?.isOnline) query = query.eq('is_online', true);
    if (filters?.isInPerson) query = query.eq('is_in_person', true);
    if (filters?.maxRate) query = query.lte('hourly_rate', filters.maxRate);
    if (filters?.subject) {
      query = query.contains('subjects', [filters.subject]);
    }

    const { data, error } = await query.order('rating', { ascending: false });
    if (error) throw error;
    return data as Tutor[];
  },

  async getTutorById(tutorId: string): Promise<Tutor> {
    const { data, error } = await supabase
      .from('tutors')
      .select('*, user:users(*)')
      .eq('id', tutorId)
      .single();
    if (error) throw error;
    return data as Tutor;
  },

  async getTutorReviews(tutorId: string): Promise<TutorReview[]> {
    const { data, error } = await supabase
      .from('tutor_reviews')
      .select('*, student:users(*)')
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as TutorReview[];
  },

  async createBooking(booking: {
    studentId: string;
    tutorId: string;
    subject: string;
    sessionDate: string;
    sessionTime: string;
    durationHours: number;
    sessionType: SessionType;
    notes?: string;
    totalAmount: number;
    platformFee: number;
  }): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        student_id: booking.studentId,
        tutor_id: booking.tutorId,
        subject: booking.subject,
        session_date: booking.sessionDate,
        session_time: booking.sessionTime,
        duration_hours: booking.durationHours,
        session_type: booking.sessionType,
        notes: booking.notes,
        total_amount: booking.totalAmount,
        platform_fee: booking.platformFee,
        status: 'pending',
      })
      .select('*, tutor:tutors(*, user:users(*))')
      .single();
    if (error) throw error;
    return data as Booking;
  },

  async getStudentBookings(studentId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, tutor:tutors(*, user:users(*))')
      .eq('student_id', studentId)
      .order('session_date', { ascending: true });
    if (error) throw error;
    return data as Booking[];
  },

  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    if (error) throw error;
  },
};
