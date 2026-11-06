'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Tutor, TutorReview } from '@eagle-pathway/shared';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Home,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CreditCard,
  Send,
} from 'lucide-react';
import { formatDate } from '@/lib/date';

export default function TutorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tutorId = params?.id as string;

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedSubject, setSelectedSubject] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'online' | 'in_person'>('online');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('14:00');
  const [durationHours, setDurationHours] = useState(1);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe'>('telebirr');
  const [transactionRef, setTransactionRef] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadTutor() {
      if (!tutorId) return;
      try {
        const [{ data: tData, error: tErr }, { data: rData }] = await Promise.all([
          supabase
            .from('tutors')
            .select('*, user:users(*)')
            .eq('id', tutorId)
            .single(),
          supabase
            .from('tutor_reviews')
            .select('*, student:users(*)')
            .eq('tutor_id', tutorId)
            .order('created_at', { ascending: false }),
        ]);

        if (tErr) throw tErr;
        setTutor(tData as any);
        setReviews((rData as any) || []);

        if (tData?.subjects?.[0]) {
          setSelectedSubject(tData.subjects[0]);
        }
      } catch (err) {
        console.warn('Load tutor profile error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTutor();
  }, [tutorId]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      router.push('/login');
      return;
    }

    if (!sessionDate || !sessionTime || !selectedSubject) {
      setErrorMsg('Please select a session subject, date, and preferred time.');
      return;
    }

    setBookingLoading(true);
    try {
      const scheduledDateTime = new Date(`${sessionDate}T${sessionTime}:00`).toISOString();
      const hourlyRate = tutor?.hourly_rate || 350;
      const subtotal = hourlyRate * durationHours;
      const platformFee = Math.round(subtotal * 0.1);
      const totalAmount = subtotal + platformFee;

      const { error } = await supabase.from('bookings').insert({
        student_id: user.id,
        tutor_id: tutorId,
        subject: selectedSubject,
        session_type: deliveryMode,
        session_date: scheduledDateTime,
        duration_minutes: durationHours * 60,
        hourly_rate: hourlyRate,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'pending',
        notes: notes.trim() || undefined,
        payment_reference: transactionRef.trim() || undefined,
        payment_method: paymentMethod,
      });

      if (error) throw error;
      setBookingSuccess(true);
    } catch (err: any) {
      setErrorMsg('Unable to confirm booking. Please review your details and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#0B2A5B]/20 border-t-[#0B2A5B] rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Loading instructor profile...</p>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900">Tutor Not Found</h2>
        <Link
          href="/tutors"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold"
        >
          <ArrowLeft size={14} />
          <span>Back to Tutors Marketplace</span>
        </Link>
      </div>
    );
  }

  const hourlyRate = tutor.hourly_rate || 350;
  const subtotal = hourlyRate * durationHours;
  const platformFee = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + platformFee;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Back button */}
      <Link
        href="/tutors"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0B2A5B] transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to All Tutors</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Tutor Biography & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-[#0B2A5B] text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden flex-shrink-0">
                {tutor.user?.avatar_url ? (
                  <img
                    src={tutor.user.avatar_url}
                    alt={tutor.user.full_name || 'Tutor'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (tutor.user?.full_name || 'Tutor').slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-[#0B2A5B]">
                    {tutor.user?.full_name || 'Verified Tutor'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    <ShieldCheck size={14} className="text-blue-600" />
                    <span>Verified Educator</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span>{(tutor.rating || 4.9).toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
                  </div>
                  <span>•</span>
                  <span>{tutor.total_sessions || 15}+ sessions conducted</span>
                </div>

                {tutor.education && (
                  <p className="text-xs text-slate-500 font-medium">
                    🎓 {tutor.education}
                  </p>
                )}
              </div>
            </div>

            {/* About */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h2 className="text-base font-bold text-slate-900">About the Instructor</h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {tutor.bio || 'Dedicated educator with deep expertise in coaching students for competitive university entry examinations and foundational STEM subjects.'}
              </p>
            </div>

            {/* Specializations */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Teaching Subjects</h2>
              <div className="flex flex-wrap gap-2">
                {(tutor.subjects || ['Math', 'Physics', 'SAT']).map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Student Reviews Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">
              Student Feedback ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No published reviews yet. Be the first student to review this instructor after your session!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {r.student?.full_name || 'Verified Scholar'}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < (r.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                    <p className="text-[10px] text-slate-400">
                      {r.created_at ? formatDate(new Date(r.created_at), 'MMM d, yyyy') : 'Recent'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Interactive Booking Checkout */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-lg sticky top-28 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-2xl font-extrabold text-[#0B2A5B]">{hourlyRate} ETB</span>
            <span className="text-xs text-slate-500 font-medium"> / hour</span>
          </div>

          {bookingSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900">Booking Request Submitted!</h3>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your session request with {tutor.user?.full_name || 'the tutor'} has been created. The instructor will confirm the session time shortly.
              </p>
              <Link
                href="/bookings"
                className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold"
              >
                View My Sessions
              </Link>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
                >
                  {(tutor.subjects || ['Mathematics']).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Mode Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Delivery Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('online')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${deliveryMode === 'online'
                      ? 'border-[#0B2A5B] bg-[#0B2A5B]/5 text-[#0B2A5B] ring-2 ring-[#0B2A5B]/20'
                      : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    <Globe size={14} />
                    <span>Online (Meet)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('in_person')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${deliveryMode === 'in_person'
                      ? 'border-[#0B2A5B] bg-[#0B2A5B]/5 text-[#0B2A5B] ring-2 ring-[#0B2A5B]/20'
                      : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    <Home size={14} />
                    <span>In-Person</span>
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 1.5, 2].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDurationHours(hrs)}
                      className={`py-2 rounded-xl border text-xs font-bold ${durationHours === hrs
                        ? 'border-[#0B2A5B] bg-[#0B2A5B]/5 text-[#0B2A5B] ring-2 ring-[#0B2A5B]/20'
                        : 'border-slate-200 text-slate-600'
                        }`}
                    >
                      {hrs} hr{hrs > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Instructor Fee ({durationHours} hr):</span>
                  <span>{subtotal} ETB</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee (10%):</span>
                  <span>{platformFee} ETB</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                  <span>Total Amount:</span>
                  <span className="text-[#0B2A5B]">{totalAmount} ETB</span>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="space-y-2 text-xs">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telebirr')}
                    className={`p-2 rounded-xl border font-bold text-center ${paymentMethod === 'telebirr'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    Telebirr
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cbe')}
                    className={`p-2 rounded-xl border font-bold text-center ${paymentMethod === 'cbe'
                      ? 'border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-600/20'
                      : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    CBE Bank
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-700 space-y-1">
                  {paymentMethod === 'telebirr' ? (
                    <p>Pay to Telebirr Merchant: <strong>Eagle Pathway (0911234567)</strong></p>
                  ) : (
                    <p>Pay to CBE Account: <strong>1000234567891 (Eagle Pathway)</strong></p>
                  )}
                  <p className="text-slate-500">Enter transaction reference number below after transfer.</p>
                </div>

                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Transaction Ref / Screenshot Ref"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-extrabold shadow-lg shadow-[#0B2A5B]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {bookingLoading ? (
                  <Loader2 size={16} className="animate-spin text-[#C9A84C]" />
                ) : (
                  <>
                    <span>Confirm &amp; Book Session</span>
                    <Send size={14} className="text-[#C9A84C]" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
