'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  Globe,
  Award,
  CheckCircle2,
  Save,
  Loader2,
  Camera,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [gpa, setGpa] = useState('');
  const [city, setCity] = useState('');
  const [academicSummary, setAcademicSummary] = useState('');
  const [targetDegree, setTargetDegree] = useState('bachelors');
  const [hasIelts, setHasIelts] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setGradeLevel(user.grade_level || '');
      setGpa(user.gpa ? String(user.gpa) : '');
      setCity(user.city || '');
      setAcademicSummary(user.academic_summary || '');
      setTargetDegree(user.target_degree_level || 'bachelors');
      setHasIelts(!!user.has_ielts);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        grade_level: gradeLevel.trim() || undefined,
        gpa: gpa ? parseFloat(gpa) : undefined,
        city: city.trim() || undefined,
        academic_summary: academicSummary.trim() || undefined,
        target_degree_level: targetDegree,
        has_ielts: hasIelts,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.warn('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
          Profile &amp; Academic Background
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details and academic credentials for scholarship matching.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in duration-150">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>Your profile information has been saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Personal Details
          </h2>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#0B2A5B] text-white flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden flex-shrink-0">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                (fullName || 'EP').slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">{fullName || 'Eagle Scholar'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold capitalize">
                Role: {user?.role || 'student'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address (Account ID)
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                City / Region
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Addis Ababa"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Academic Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Academic Background &amp; Target Goals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Degree Level
              </label>
              <select
                value={targetDegree}
                onChange={(e) => setTargetDegree(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="high_school">High School Diploma / Grade 12</option>
                <option value="bachelors">Bachelor&apos;s Degree (Undergraduate)</option>
                <option value="masters">Master&apos;s Degree (Graduate)</option>
                <option value="phd">PhD / Doctorate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cumulative GPA (e.g. 3.8 / 4.0)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder="3.85"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current School / University / Grade
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. Grade 12 or Addis Ababa University 3rd year"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="ielts"
                checked={hasIelts}
                onChange={(e) => setHasIelts(e.target.checked)}
                className="w-4 h-4 rounded text-[#0B2A5B] focus:ring-[#0B2A5B]"
              />
              <label htmlFor="ielts" className="text-xs font-semibold text-slate-700">
                I have taken IELTS / TOEFL English Proficiency Exam
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Academic Interests &amp; Career Summary
            </label>
            <textarea
              value={academicSummary}
              onChange={(e) => setAcademicSummary(e.target.value)}
              placeholder="Describe your academic interests, preferred majors (e.g. Computer Science, Public Health, Mechanical Engineering), and career aspirations..."
              rows={4}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin text-[#C9A84C]" /> : <Save size={16} />}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}

