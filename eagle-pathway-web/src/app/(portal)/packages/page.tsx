'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  Package,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getErrorMessage } from '@/utils/errorHandler';

interface Tier {
  id: string;
  name: string;
  price: string;
  period: string;
  popular?: boolean;
  desc: string;
  features: string[];
}

const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Essential Review',
    price: '2,500 ETB',
    period: 'one-time',
    desc: 'Perfect for reviewing a single university scholarship dossier before final submission.',
    features: [
      'Comprehensive SOP & Essay review by senior advisor',
      'Grammar, tone & structure optimization',
      'Scholarship eligibility audit',
      '48-hour expedited turnaround',
    ],
  },
  {
    id: 'vip',
    name: 'VIP Full Admissions Pathway',
    price: '12,500 ETB',
    period: 'full cycle',
    popular: true,
    desc: 'Our flagship 360° counseling program for competitive undergraduate & graduate programs.',
    features: [
      'Personalized scholarship matching (up to 10 universities)',
      'Unlimited SOP, motivation letter & CV revisions',
      '3 Mock interview preparation sessions with alumni',
      '5 Hours of 1-on-1 tutoring (SAT, IELTS or Math)',
      'Direct WhatsApp advisor access 7 days a week',
      'Embassy student visa dossier preparation',
    ],
  },
  {
    id: 'tutoring_bundle',
    name: '10-Hour Tutor Intensive',
    price: '3,200 ETB',
    period: '10 hours',
    desc: 'Dedicated private 1-on-1 tutoring credits for exam cramming and STEM mastery.',
    features: [
      '10 Hours with verified senior tutors',
      'Flexible scheduling (Online or In-Person Addis)',
      'Full diagnostic mock exam with score breakdown',
      'Free practice exam question bank',
    ],
  },
];

export default function CareerPackagesPage() {
  const { user } = useAuthStore();
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier || !user) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        user_id: user.id,
        service_type: selectedTier.name,
        recipient_name: user.full_name || 'Scholar Client',
        reason: `Phone: ${phoneNumber || user.phone || 'N/A'}`,
        additional_details: `Inquiry for ${selectedTier.name} (${selectedTier.price}). Target & Details: ${notes.trim() || 'General Consultation'}`,
        status: 'pending',
      };

      const { error } = await supabase.from('service_requests').insert(payload);

      if (error) {
        // Fallback retry for legacy database instances
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          const { error: fallbackErr } = await supabase.from('service_requests').insert({
            user_id: user.id,
            service_type: selectedTier.name,
            notes: `Phone: ${phoneNumber || user.phone || 'N/A'} | Inquiry for ${selectedTier.name} (${selectedTier.price}). Details: ${notes}`,
            status: 'pending',
          });
          if (fallbackErr) throw fallbackErr;
        } else {
          throw error;
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      console.warn('Package inquiry error:', err);
      setErrorMsg(getErrorMessage(err, 'Failed to submit inquiry. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Admissions Consulting</p>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Admissions Counseling &amp; Study Packages
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Accelerate your acceptance rates with 1-on-1 guidance from international alumni, certified essay editors, and expert test instructors.
        </p>
      </div>

      {/* Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-xl p-6 flex flex-col justify-between transition-all relative ${
              tier.popular
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-brand-gold/60'
                : 'bg-white border border-slate-200/80 text-slate-900 shadow-xs hover:border-slate-300'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-gold text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                ★ Most Popular
              </span>
            )}

            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold">{tier.name}</h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>
                  {tier.desc}
                </p>
              </div>

              <div>
                <span className="text-2xl font-bold tracking-tight">{tier.price}</span>
                <span className={`text-xs ml-1 font-medium ${tier.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                  / {tier.period}
                </span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-200/20 text-xs">
                {tier.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={15}
                      className={`flex-shrink-0 mt-0.5 ${
                        tier.popular ? 'text-brand-gold' : 'text-emerald-600'
                      }`}
                    />
                    <span className={tier.popular ? 'text-slate-200' : 'text-slate-700'}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedTier(tier);
                setSubmitted(false);
              }}
              className={`w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                tier.popular
                  ? 'bg-brand-gold text-slate-950 hover:brightness-105'
                  : 'bg-brand-blue text-white hover:bg-brand-blue/90'
              }`}
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Inquiry Modal */}
      {selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-slate-200/80 space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Plan Consultation</p>
              <h3 className="text-base font-bold text-slate-900">
                Inquire About {selectedTier.name}
              </h3>
            </div>

            {submitted ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-center space-y-3">
                <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">Inquiry Received!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Our academic admissions advisor will call you within 2 business hours to review your target programs and finalize your onboarding.
                </p>
                <button
                  onClick={() => setSelectedTier(null)}
                  className="mt-2 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold shadow-xs hover:bg-brand-blue/90"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Tier Price: <strong className="text-slate-900 font-bold">{selectedTier.price}</strong>. Enter your phone number below, and an advisor will contact you directly.
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+251 91 234 5678"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Target Degree &amp; Country
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Master's in Computer Science in Germany or USA undergraduate..."
                    rows={3}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTier(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin text-brand-gold" /> : <Send size={14} />}
                    <span>Submit Inquiry</span>
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

