import { create } from 'zustand';
import { tutorsService } from '../services/tutors';
import { Booking, BookingStatus, Tutor } from '../types';
import { supabase } from '../services/supabase';

interface BookingState {
  bookings: Booking[];
  tutorProfile: Tutor | null;
  isLoadingBookings: boolean;

  // Actions
  loadBookings: (userId: string) => Promise<void>;
  loadTutorBookings: (tutorId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  setTutorProfile: (profile: Tutor | null) => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  tutorProfile: null,
  isLoadingBookings: false,

  loadBookings: async (userId) => {
    set({ isLoadingBookings: true });
    try {
      const bookings = await tutorsService.getStudentBookings(userId);
      set({ bookings });
    } finally {
      set({ isLoadingBookings: false });
    }
  },

  loadTutorBookings: async (userId) => {
    set({ isLoadingBookings: true });
    try {
      const bookings = await tutorsService.getTutorBookings(userId);
      set({ bookings });
      
      // Load profile if not already set or to refresh
      const { data: tutor } = await supabase.from('tutors').select('*, user:users(*)').eq('user_id', userId).single();
      if (tutor) set({ tutorProfile: tutor });
    } finally {
      set({ isLoadingBookings: false });
    }
  },

  cancelBooking: async (bookingId) => {
    await tutorsService.cancelBooking(bookingId);
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ),
    }));
  },

  updateBookingStatus: async (bookingId, status) => {
    await tutorsService.updateBookingStatus(bookingId, status);
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status } : b
      ),
    }));
  },

  setTutorProfile: (profile) => set({ tutorProfile: profile }),
}));
