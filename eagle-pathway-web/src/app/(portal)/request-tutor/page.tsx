'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

const POPULAR_SUBJECTS = [
  'Math (Algebra/Calculus)',
  'Physics',
  'Chemistry',
  'Biology',
  'English Grammar & Speaking',
  'SAT Prep',
  'IELTS Academic',
  'TOEFL iBT',
  'Amharic',
  'Computer & Coding (Python/Web)',
  'Economics & Business',
  'General Tutoring / Homework Help',
];

const GRADE_LEVELS = [
  'Grade 1 - 4 (Elementary)',
  'Grade 5 - 8 (Middle School)',
  'Grade 9 - 10 (Secondary)',
  'Grade 11 - 12 (Prep & University Entrance)',
  'University / College Degree',
  'Standardized Test Prep (SAT/IELTS/GRE)',
  'Adult & Professional Learner',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RequestTutorPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [requesterName, setRequesterName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [grade, setGrade] = useState('Grade 11 - 12 (Prep & University Entrance)');
  const [deliveryMode, setDeliveryMode] = useState<'In-person' | 'Online' | 'Hybrid'>('Hybrid');
  const [area, setArea] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Math (Algebra/Calculus)']);
  const [customSubject, setCustomSubject] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [hoursPerSession, setHoursPerSession] = useState('2');
  const [startTime, setStartTime] = useState('4:00 PM (10:00 LT)');
  const [hourlyBudget, setHourlyBudget] = useState('500');
  const [genderPreference, setGenderPreference] = useState<'both' | 'female' | 'male'>('both');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleSubject = (subj: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSubject.trim();
    if (clean && !selectedSubjects.includes(clean)) {
      setSelectedSubjects((prev) => [...prev, clean]);
      setCustomSubject('');
    }
  };

  const toggleDay = (d: string) => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((day) => day !== d) : [...prev, d]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!requesterName.trim()) {
      setErrorMsg('Please enter the student or parent name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter a valid phone number so our team can coordinate with your tutor.');
      return;
    }
    if (deliveryMode !== 'Online' && !area.trim()) {
      setErrorMsg('Please enter your area or neighborhood in Addis Ababa (e.g. Bole, Kazanchis, Kality).');
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMsg('Please select at least one tutoring subject.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        posted_by: user?.id || null,
        requester_name: requesterName.trim(),
        requester_phone: phone.trim(),
        place: deliveryMode === 'Online' ? 'Online (Google Meet)' : area.trim(),
        grade: grade,
        mode: deliveryMode,
        subjects: selectedSubjects,
        hourly_rate: Number(hourlyBudget) || 500,
        hours_per_session: Number(hoursPerSession) || 2,
        gender_preference: genderPreference,
        status: 'open',
        notes: [
          `Days: ${selectedDays.join(', ') || 'Flexible'}`,
          `Time: ${startTime}`,
          notes.trim(),
        ]
          .filter(Boolean)
          .join(' | '),
      };

      const { error } = await supabase.from('tutor_job_posts').insert(payload);
      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      console.error('Submit tutor request error:', err);
      setErrorMsg('Failed to post your tutor request. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Tutor Request Broadcasted Successfully!
        </h1>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
          Your request is now live to verified Eagle Pathway educators. Our academic team will also review your request and connect you via phone/WhatsApp within a few hours.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mb-6 max-w-md mx-auto space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Student:</span>
            <span className="font-semibold text-slate-800">{requesterName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Subjects:</span>
            <span className="font-semibold text-slate-800">{selectedSubjects.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mode &amp; Location:</span>
            <span className="font-semibold text-slate-800">
              {deliveryMode} {deliveryMode !== 'Online' ? `(${area})` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Budget:</span>
            <span className="font-semibold text-emerald-700">{hourlyBudget} ETB / hour</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setSuccess(false);
              setSelectedSubjects([]);
              setArea('');
              setNotes('');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Post Another Request
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>Request a Verified 1-on-1 Tutor</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C]/15 text-[#9A7B2C] border border-[#C9A84C]/30">
              1-Minute Wizard
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Tell us your subject needs, schedule, and budget. We match you with top-rated STEM, English, and National Exam educators.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2.5">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        {/* Contact Info */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Phone size={15} className="text-[#0B2A5B]" />
            <span>1. Contact &amp; Student Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student or Parent Name *
              </label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="e.g. Selamawit Bekele"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Grade / Educational Level *
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subjects */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={15} className="text-[#0B2A5B]" />
            <span>2. Select Needed Subjects ({selectedSubjects.length} selected)</span>
          </h2>

          <div className="flex flex-wrap gap-2">
            {POPULAR_SUBJECTS.map((subj) => {
              const selected = selectedSubjects.includes(subj);
              return (
                <button
                  type="button"
                  key={subj}
                  onClick={() => toggleSubject(subj)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selected
                      ? 'bg-[#0B2A5B] text-white shadow-sm ring-1 ring-[#0B2A5B]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {subj}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 max-w-md pt-2">
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Other subject (e.g. French, Arabic, Civics)"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCustomSubject}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Delivery Mode & Location */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MapPin size={15} className="text-[#0B2A5B]" />
            <span>3. Delivery Mode &amp; Location</span>
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'In-person', label: 'In-Person (Home)', desc: 'Tutor visits your home' },
              { id: 'Online', label: 'Online (Google Meet)', desc: 'Interactive digital classroom' },
              { id: 'Hybrid', label: 'Hybrid', desc: 'Mix of home & online' },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setDeliveryMode(m.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliveryMode === m.id
                    ? 'border-[#0B2A5B] bg-[#0B2A5B]/5 ring-1 ring-[#0B2A5B]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">{m.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>

          {deliveryMode !== 'Online' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Neighborhood / Subcity in Addis Ababa *
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Bole Medhanialem, Kazanchis, Kality near Crown Hotel"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
              />
            </div>
          )}
        </div>

        {/* Schedule & Budget */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={15} className="text-[#0B2A5B]" />
            <span>4. Schedule &amp; Hourly Budget</span>
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Preferred Days of the Week
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const selected = selectedDays.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`w-11 h-9 rounded-xl text-xs font-bold transition-all ${
                      selected
                        ? 'bg-[#0B2A5B] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hours Per Session
              </label>
              <select
                value={hoursPerSession}
                onChange={(e) => setHoursPerSession(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="1.5">1.5 Hours</option>
                <option value="2">2 Hours (Standard)</option>
                <option value="2.5">2.5 Hours</option>
                <option value="3">3 Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preferred Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 4:00 PM (10:00 LT)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Budget (ETB / Hour)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="200"
                  step="50"
                  value={hourlyBudget}
                  onChange={(e) => setHourlyBudget(e.target.value)}
                  className="w-full pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  ETB/hr
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Gender Preference for Educator
            </label>
            <div className="flex gap-3">
              {[
                { id: 'both', label: 'No Preference' },
                { id: 'female', label: 'Female Educator' },
                { id: 'male', label: 'Male Educator' },
              ].map((g) => (
                <label key={g.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="genderPref"
                    checked={genderPreference === g.id}
                    onChange={() => setGenderPreference(g.id as any)}
                    className="accent-[#0B2A5B]"
                  />
                  <span>{g.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Special Learning Goals or Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Preparing for upcoming Ethiopian national entrance exam in May, needs extra patience with Calculus integration..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>100% verified educators &amp; satisfaction guaranteed.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] text-white text-xs font-bold hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Broadcasting Request...</span>
            ) : (
              <>
                <span>Post Tutor Request</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

