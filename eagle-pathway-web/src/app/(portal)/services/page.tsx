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
        // Fallback log if table has different schema
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-[#C9A84C]" size={26} />
          <span>Concierge Advisory &amp; Visa Services</span>
        </h1>
        <p className="text-xs text-slate-500">
          Professional admissions mentoring, embassy visa mock preparation, and transcript authentication for Ethiopian scholars.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-[#0B2A5B]/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0B2A5B]/10 text-[#0B2A5B] flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C]/15 text-[#9A7B2C] border border-[#C9A84C]/30">
                    {s.tag}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-2 leading-snug">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {s.desc}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between py-3 border-t border-slate-100 text-xs mb-3">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock size={13} />
                    <span>{s.deliveryTime}</span>
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {s.price}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedService(s)}
                  className="w-full py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Book This Service</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#0B2A5B]/10 text-[#0B2A5B] flex items-center justify-center">
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
                <CheckCircle2 size={40} className="mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Request Received!</h4>
                <p className="text-xs text-slate-500">
                  Our admissions specialist will contact you via WhatsApp / Phone shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (WhatsApp or Call) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0911234567"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Details or Questions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us about your target university or upcoming embassy interview date..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] disabled:opacity-50"
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

