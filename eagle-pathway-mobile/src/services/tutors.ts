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
    
    // 1. In-app Notification
    await supabase.from('notifications').insert({
      user_id: tutorUserId,
      type: 'booking_request',
      title: 'New Booking Request 📅',
      body: `${studentName} has requested a tutoring session with you.`,
      data: { tutor_id: tutorId, type: 'booking_request' },
    });

    // 2. Direct Background Push Notification to Tutor device
    try {
      const { data: tokenRows } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', tutorUserId);

      if (tokenRows && tokenRows.length > 0) {
        const messages = tokenRows
          .map(r => r.token?.trim())
          .filter(t => t && (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken')))
          .map(token => ({
            to: token,
            sound: 'default',
            title: 'New Booking Request 📅',
            body: `${studentName} has requested a tutoring session with you.`,
            data: { url: '/(tabs)/activity' },
          }));

        if (messages.length > 0) {
          fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
          }).catch(() => {});
        }
      }
    } catch {}
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

  /**
   * Atomic slot reservation engine. Prevents double-booking race conditions.
   */
  async createBookingAtomic(params: {
    tutorId: string;
    studentId: string;
    sessionTime: string;
    subject?: string;
    hourlyRate?: number;
  }): Promise<{ success: boolean; bookingId?: string; message: string }> {
    const { data, error } = await supabase.rpc('reserve_tutor_slot', {
      p_tutor_id: params.tutorId,
      p_student_id: params.studentId,
      p_session_time: params.sessionTime,
      p_subject: params.subject || 'General Tutoring',
      p_hourly_rate: params.hourlyRate || 400,
    });

    if (error) {
      console.warn('reserve_tutor_slot RPC fallback:', error.message);
      const { data: insertData, error: insertError } = await supabase
        .from('bookings')
        .insert({
          tutor_id: params.tutorId,
          student_id: params.studentId,
          session_time: params.sessionTime,
          subject: params.subject || 'General Tutoring',
          amount: params.hourlyRate || 400,
          status: 'confirmed',
        })
        .select('id')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return {
            success: false,
            message: 'This time slot has already been reserved by another student. Please choose another time.',
          };
        }
        throw insertError;
      }

      return { success: true, bookingId: insertData?.id, message: 'Session successfully booked.' };
    }

    const res = data as { success: boolean; booking_id?: string; message: string; code?: string };
    return {
      success: res.success,
      bookingId: res.booking_id,
      message: res.message,
    };
  },
};
