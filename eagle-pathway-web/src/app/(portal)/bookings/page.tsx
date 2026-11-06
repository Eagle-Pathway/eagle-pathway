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
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Calendar size={14} />
            <span>Instruction Schedule</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tutoring Sessions &amp; Bookings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your scheduled 1-on-1 sessions, video conference links, and lesson confirmations.
          </p>
        </div>

        {!isTutor && (
          <Link
            href="/tutors"
            className="px-3.5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>Book New Session</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your scheduled sessions...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/80 p-8 space-y-3 shadow-xs">
          <Calendar size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Sessions Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isTutor
              ? 'You do not have any upcoming tutoring sessions scheduled yet.'
              : 'Browse our verified tutors directory to book your first 1-on-1 tutoring session.'}
          </p>
          {!isTutor && (
            <Link
              href="/tutors"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs"
            >
              Browse Tutors
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((b) => {
            const partner = isTutor ? (b as any).student : (b as any).tutor?.user;
            const status = b.status || 'pending';

            return (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : status === 'completed'
                          ? 'bg-blue-50 text-brand-blue border border-blue-200/60'
                          : status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {status}
                    </span>

                    <span className="text-xs font-bold text-slate-900">
                      {b.total_amount ? `${b.total_amount} ETB` : ''}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                      {b.subject || 'Academic Tutoring'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isTutor ? 'Student:' : 'Instructor:'}{' '}
                      <span className="font-semibold text-slate-700">{partner?.full_name || 'Member'}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-slate-400" />
                      <span>
                        {b.session_date
                          ? formatDate(new Date(b.session_date), 'EEEE, MMMM d, yyyy')
                          : 'Date TBD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-slate-400" />
                      <span>
                        {b.session_date ? formatDate(new Date(b.session_date), 'h:mm a') : ''} ({(b as any).duration_minutes || (b.duration_hours ? b.duration_hours * 60 : 60)} mins)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.session_type === 'in_person' ? (
                        <>
                          <MapPin size={13} className="text-slate-400" />
                          <span>In-Person (Addis Ababa)</span>
                        </>
                      ) : (
                        <>
                          <Video size={13} className="text-slate-400" />
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
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Confirm Session
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                      className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200/60"
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
