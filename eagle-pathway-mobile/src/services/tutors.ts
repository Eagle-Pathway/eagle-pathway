import { supabase } from './supabase';
import { Tutor, TutorReview, Booking, BookingStatus, SessionType } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORS_CACHE_KEY = 'eagle_tutors_offline_cache_v1';
const TUTOR_DETAIL_CACHE_PREFIX = 'eagle_tutor_detail_';

export const tutorsService = {
  async getTutors(filters?: {
    subject?: string;
    gradeLevel?: string;
    isOnline?: boolean;
    isInPerson?: boolean;
    maxRate?: number;
    search?: string;
  }): Promise<Tutor[]> {
    try {
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

      // Cache the full verified tutors list when general or unfiltered fetch succeeds
      if (!filters || Object.keys(filters).length === 0 || (!filters.subject && !filters.search && !filters.maxRate && !filters.isOnline && !filters.isInPerson)) {
        if (data && Array.isArray(data)) {
          AsyncStorage.setItem(TUTORS_CACHE_KEY, JSON.stringify(data)).catch(() => {});
        }
      }

      return data as Tutor[];
    } catch (networkError: any) {
      // Offline fallback: Attempt to load from local AsyncStorage cache
      try {
        const cachedRaw = await AsyncStorage.getItem(TUTORS_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as Tutor[];
          if (Array.isArray(cached) && cached.length > 0) {
            let filtered = cached;

            if (filters?.isOnline) {
              filtered = filtered.filter(t => t.is_online);
            }
            if (filters?.isInPerson) {
              filtered = filtered.filter(t => t.is_in_person);
            }
            if (filters?.maxRate) {
              filtered = filtered.filter(t => t.hourly_rate <= filters.maxRate!);
            }
            if (filters?.subject) {
              const subLower = filters.subject.toLowerCase();
              filtered = filtered.filter(t => 
                (t.subjects || []).some(s => s.toLowerCase().includes(subLower)) ||
                (t.user?.interested_subjects || []).some(s => s.toLowerCase().includes(subLower))
              );
            }
            if (filters?.search) {
              const s = filters.search.trim().toLowerCase();
              filtered = filtered.filter(t => {
                const fullName = t.user?.full_name?.toLowerCase() || '';
                const uni = t.user?.university_name?.toLowerCase() || '';
                const city = (t.user?.city || t.location || '').toLowerCase();
                const exp = (t.bio || t.user?.teaching_experience || '').toLowerCase();
                const allSubjects = (t.subjects || []).concat(t.user?.interested_subjects || []).map(sub => sub.toLowerCase());

                return fullName.includes(s) ||
                  uni.includes(s) ||
                  city.includes(s) ||
                  exp.includes(s) ||
                  allSubjects.some(sub => sub.includes(s));
              });
            }

            return filtered;
          }
        }
      } catch (cacheErr) {
        console.warn('[TutorsService] Cache fallback error:', cacheErr);
      }
      throw networkError;
    }
  },

  async getVerifiedTutorsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('tutors')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);
      if (error) throw error;
      return count ?? 0;
    } catch {
      try {
        const cachedRaw = await AsyncStorage.getItem(TUTORS_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as Tutor[];
          if (Array.isArray(cached)) return cached.length;
        }
      } catch {}
      return 0;
    }
  },

  async getTutorById(tutorId: string): Promise<Tutor> {
    const detailKey = `${TUTOR_DETAIL_CACHE_PREFIX}${tutorId}`;
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*, user:users(*)')
        .eq('id', tutorId)
        .single();
      if (error) throw error;

      if (data) {
        AsyncStorage.setItem(detailKey, JSON.stringify(data)).catch(() => {});
      }
      return data as Tutor;
    } catch (networkError: any) {
      // Offline fallback: Check specific tutor cache or find in general cache
      try {
        const cachedDetail = await AsyncStorage.getItem(detailKey);
        if (cachedDetail) {
          return JSON.parse(cachedDetail) as Tutor;
        }
        const generalCache = await AsyncStorage.getItem(TUTORS_CACHE_KEY);
        if (generalCache) {
          const tutors = JSON.parse(generalCache) as Tutor[];
          const match = tutors.find(t => t.id === tutorId);
          if (match) return match;
        }
      } catch (cacheErr) {
        console.warn('[TutorsService] getTutorById cache error:', cacheErr);
      }
      throw networkError;
    }
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
