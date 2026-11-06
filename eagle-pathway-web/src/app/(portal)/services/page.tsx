'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  Plane,
  FileCheck,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const SERVICES = [
  {
    id: 'visa-prep',
    title: 'Embassy Visa Interview & Financial Dossier',
    desc: 'Mock embassy interviews (US F-1, Schengen Visa, UK Student Route) with verified former scholarship recipients. We audit bank statements, sponsorship affidavits, and return-intent ties.',
    price: '2,500 ETB',
    deliveryTime: '3 - 5 Days',
    icon: Plane,
    tag: 'High Demand',
  },
  {
    id: 'sop-deep-edit',
    title: '48-Hour Express SOP & Motivation Letter Polish',
    desc: 'Comprehensive line-by-line editorial review by native English admissions specialists. We elevate your personal narrative, rectify grammatical nuance, and ensure alignment with committee rubric.',
    price: '1,800 ETB',
    deliveryTime: '48 Hours',
    icon: FileCheck,
    tag: 'Fast Turnaround',
  },
  {
    id: 'wes-eval',
    title: 'WES & High School Transcript Verification',
    desc: 'Assistance with Ethiopian national education bureau transcript authentication, Ministry of Foreign Affairs attestation, and World Education Services (WES) credential evaluation submission.',
    price: '2,000 ETB',
    deliveryTime: '1 Week',
    icon: GraduationCap,
    tag: 'Official Credentialing',
  },
  {
    id: 'tutor-intensive',
    title: '10-Hour STEM or SAT Exam Intensive',
    desc: 'One-on-one tailored crash course with a top-ranked Addis Ababa educator. Includes diagnostic diagnostic tests, past paper dissection, and targeted weakness elimination.',
    price: '4,500 ETB',
    deliveryTime: 'Custom Schedule',
    icon: Sparkles,
    tag: 'Top Rated',
  },
];

export default function ServicesPage() {
  const { user } = useAuthStore();
  const [selectedService, setSelectedService] = useState<any | null>(null);

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMsg('Please enter your phone number so our advisor can reach you.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.from('service_requests').insert({
        user_id: user?.id || null,
        service_id: selectedService?.id,
        service_name: selectedService?.title,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
        status: 'pending',
      });

      if (error) {
        console.warn('Service insert note:', error.message);
      }

      setSuccess(true);
      setTimeout(() => {
        setSelectedService(null);
        setSuccess(false);
        setNotes('');
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Sparkles size={14} className="text-brand-gold" />
            <span>Advisory Concierge</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Concierge Advisory &amp; Visa Services
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Professional admissions mentoring, embassy visa mock preparation, and transcript authentication for Ethiopian scholars.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
                    <Icon size={18} />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-brand-blue border border-blue-200/60 uppercase">
                    {s.tag}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-slate-900 mb-1.5 leading-snug">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {s.desc}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between py-2.5 border-t border-slate-100 text-xs mb-3">
                  <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <Clock size={12} className="text-slate-400" />
                    <span>{s.deliveryTime}</span>
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {s.price}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedService(s)}
                  className="w-full py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Book This Service</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                <selectedService.icon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedService.title}</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedService.price} • {selectedService.deliveryTime}
                </p>
              </div>
            </div>

            {success ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle2 size={36} className="mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Request Received!</h4>
                <p className="text-xs text-slate-500">
                  Our admissions specialist will contact you via WhatsApp / Phone shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Phone Number (WhatsApp or Call) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0911234567"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Specific Details or Questions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us about your target university or upcoming embassy interview date..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 disabled:opacity-50 shadow-xs transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
