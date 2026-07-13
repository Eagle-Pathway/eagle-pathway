import { supabase } from './supabase';
import { Tutor, TutorReview, Booking, BookingStatus, SessionType } from '../types';

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

  async getVerifiedTutorsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('tutors')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);
    if (error) throw error;
    return count ?? 0;
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

  async getTutorUserId(tutorId: string): Promise<string | null> {
    const { data } = await supabase.from('tutors').select('user_id').eq('id', tutorId).single();
    return data?.user_id ?? null;
  },

  async notifyTutorNewBooking(tutorId: string, studentName: string): Promise<void> {
    const tutorUserId = await tutorsService.getTutorUserId(tutorId);
    if (!tutorUserId) return;
    await supabase.from('notifications').insert({
      user_id: tutorUserId,
      type: 'booking_request',
      title: 'New Booking Request',
      body: `${studentName} has requested a session with you.`,
      data: { tutor_id: tutorId, type: 'booking_request' },
    });
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
    studentName?: string;
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

    // Fire-and-forget: notify tutor about new booking
    tutorsService.notifyTutorNewBooking(booking.tutorId, booking.studentName || 'A student').catch(() => {});

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

  async getTutorBookings(userId: string): Promise<Booking[]> {
    // Resolve the tutor profile ID from the auth user ID
    const { data: tutor, error: tutorError } = await supabase
      .from('tutors')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (tutorError || !tutor) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select('*, student:users(*)')
      .eq('tutor_id', tutor.id)
      .order('session_date', { ascending: true });
    if (error) throw error;
    return data as Booking[];
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    if (error) throw error;
  },
  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    if (error) throw error;
  },
  async updateTutorProfile(userId: string, updates: Partial<Tutor>): Promise<void> {
    const { error } = await supabase
      .from('tutors')
      .update(updates)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
