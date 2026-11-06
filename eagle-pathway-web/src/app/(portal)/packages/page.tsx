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
} from 'lucide-react';

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

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier || !user) return;

    setLoading(true);
    try {
      await supabase.from('service_requests').insert({
        user_id: user.id,
        service_type: selectedTier.name,
        contact_phone: phoneNumber || user.phone || '',
        notes: `Inquiry for ${selectedTier.name} (${selectedTier.price}). Details: ${notes}`,
        status: 'pending',
      });
      setSubmitted(true);
    } catch (err) {
      console.warn('Package inquiry error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#9A7B2C] text-xs font-bold border border-[#C9A84C]/30">
          <Sparkles size={14} className="text-[#C9A84C]" />
          <span>Tailored Admissions Consulting</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0B2A5B] tracking-tight">
          Admissions Counseling &amp; Study Packages
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Accelerate your acceptance rates with 1-on-1 guidance from international alumni, certified essay editors, and expert test instructors.
        </p>
      </div>

      {/* Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              tier.popular
                ? 'bg-[#0B2A5B] text-white shadow-xl ring-2 ring-[#C9A84C]'
                : 'bg-white border border-slate-200/80 text-slate-900 shadow-sm hover:shadow-md'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs font-extrabold shadow-md">
                ★ MOST POPULAR
              </span>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold">{tier.name}</h3>
                <p className={`text-xs mt-2 ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>
                  {tier.desc}
                </p>
              </div>

              <div>
                <span className="text-3xl font-extrabold">{tier.price}</span>
                <span className={`text-xs ml-1 ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>
                  / {tier.period}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200/20 text-xs">
                {tier.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={16}
                      className={`flex-shrink-0 mt-0.5 ${
                        tier.popular ? 'text-[#C9A84C]' : 'text-emerald-600'
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
              className={`w-full mt-8 py-3.5 px-4 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 ${
                tier.popular
                  ? 'bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] hover:brightness-105'
                  : 'bg-[#0B2A5B] text-white hover:bg-[#1E4D9B]'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-[#0B2A5B]">
              Inquire About {selectedTier.name}
            </h3>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Inquiry Received!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Our academic admissions advisor will call you within 2 business hours to review your target programs and finalize your onboarding.
                </p>
                <button
                  onClick={() => setSelectedTier(null)}
                  className="mt-3 px-5 py-2 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Tier Price: <strong>{selectedTier.price}</strong>. Enter your phone number below, and an advisor will contact you directly.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+251 91 234 5678"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Degree &amp; Country
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Master's in Computer Science in Germany or USA undergraduate..."
                    rows={3}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTier(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
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

