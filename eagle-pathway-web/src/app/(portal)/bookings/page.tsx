'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Booking } from '@eagle-pathway/shared';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  User,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/date';

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const isTutor = user?.role === 'tutor';

  useEffect(() => {
    if (!user?.id) return;

    async function fetchBookings() {
      try {
        const query = supabase
          .from('bookings')
          .select('*, student:users!student_id(*), tutor:tutors(*, user:users(*))')
          .order('session_date', { ascending: false });

        if (isTutor) {
          // If tutor, filter where tutor.user_id = user.id
          query.eq('tutor.user_id', user.id);
        } else {
          query.eq('student_id', user!.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setBookings((data as any) || []);
      } catch (err) {
        console.warn('Fetch bookings error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [user?.id, isTutor]);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await supabase.from('bookings').update({ status }).eq('id', bookingId);
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: status as any } : b)));
    } catch (err) {
      console.warn('Update status error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
            Tutoring Sessions &amp; Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your scheduled 1-on-1 sessions, video conference links, and lesson confirmations.
          </p>
        </div>

        {!isTutor && (
          <Link
            href="/tutors"
            className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-bold shadow-sm inline-flex items-center gap-2"
          >
            <span>Book New Session</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B2A5B]/20 border-t-[#0B2A5B] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading your scheduled sessions...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
          <Calendar size={40} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Sessions Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isTutor
              ? 'You do not have any upcoming tutoring sessions scheduled yet.'
              : 'Browse our verified tutors directory to book your first 1-on-1 tutoring session.'}
          </p>
          {!isTutor && (
            <Link
              href="/tutors"
              className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold"
            >
              Browse Tutors
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((b) => {
            const partner = isTutor ? (b as any).student : (b as any).tutor?.user;
            const status = b.status || 'pending';

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                    >
                      {status}
                    </span>

                    <span className="text-xs font-bold text-[#0B2A5B]">
                      {b.total_amount ? `${b.total_amount} ETB` : ''}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {b.subject || 'Academic Tutoring'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isTutor ? 'Student:' : 'Instructor:'}{' '}
                      <span className="font-bold text-slate-800">{partner?.full_name || 'Member'}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>
                        {b.session_date
                          ? formatDate(new Date(b.session_date), 'EEEE, MMMM d, yyyy')
                          : 'Date TBD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span>
                        {b.session_date ? formatDate(new Date(b.session_date), 'h:mm a') : ''} ({(b as any).duration_minutes || (b.duration_hours ? b.duration_hours * 60 : 60)} mins)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.session_type === 'in_person' ? (
                        <>
                          <MapPin size={14} className="text-slate-400" />
                          <span>In-Person (Addis Ababa)</span>
                        </>
                      ) : (
                        <>
                          <Video size={14} className="text-slate-400" />
                          <span>Online Video Session (Google Meet)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isTutor && status === 'pending' && (
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                    >
                      Confirm Session
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                      className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
