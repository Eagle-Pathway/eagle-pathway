'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { validatePhone } from '@eagle-pathway/shared';
import {
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  BookOpen,
  MapPin,
  Send,
  Sparkles,
  Globe,
  Home,
  Check,
} from 'lucide-react';

const AVAILABLE_TUTOR_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'SAT Prep',
  'IELTS Prep',
  'Amharic',
  'ICT & Programming',
  'Economics',
  'Geography',
  'History',
  'Civics',
];

const TEACHING_EXPERIENCE_OPTIONS = [
  'Beginner (Under 1 yr)',
  '1 – 2 Years',
  '3 – 5 Years',
  '5+ Years',
  'International School Experience',
];

const CHILDREN_GRADE_OPTIONS = [
  'KG / Primary (Grades 1-8)',
  'High School (Grades 9-12)',
  'College / SAT Prep',
];

const PREFERRED_GENDER_OPTIONS = [
  'No Preference',
  'Female Tutor Preferred',
  'Male Tutor Preferred',
];

const SESSION_FORMAT_OPTIONS = [
  'In-Person (Home Tutoring)',
  'Online Tutoring',
  'Flexible / Either',
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();

  // Common Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  // Student Fields
  const [gradeLevel, setGradeLevel] = useState('');
  const [gpa, setGpa] = useState('');
  const [academicSummary, setAcademicSummary] = useState('');
  const [targetDegree, setTargetDegree] = useState('bachelors');
  const [hasIelts, setHasIelts] = useState(false);

  // Tutor Fields
  const [livingAddress, setLivingAddress] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [teachingExperience, setTeachingExperience] = useState('1 – 2 Years');
  const [hourlyRate, setHourlyRate] = useState('400');
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isInPerson, setIsInPerson] = useState(false);
  const [tutorRecordId, setTutorRecordId] = useState<string | null>(null);

  // Parent Fields
  const [childrenGrades, setChildrenGrades] = useState<string[]>([]);
  const [preferredTutorGender, setPreferredTutorGender] = useState('No Preference');
  const [preferredSessionFormat, setPreferredSessionFormat] = useState('Flexible / Either');

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const role = user?.role || 'student';
  const isTutor = role === 'tutor' || (user as any)?.active_role === 'tutor';
  const isParent = role === 'parent' || (user as any)?.active_role === 'parent';
  const isAdmin = role === 'admin' || (user as any)?.active_role === 'admin';
  const isStudent = !isTutor && !isParent && !isAdmin;

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setCity(user.city || '');

      // Student fields
      setGradeLevel(user.grade_level || '');
      setGpa(user.gpa ? String(user.gpa) : '');
      setAcademicSummary(user.academic_summary || '');
      setTargetDegree(user.target_degree_level || 'bachelors');
      setHasIelts(!!user.has_ielts);

      // Tutor & Parent fields
      setLivingAddress((user as any).living_address || '');
      setUniversityName((user as any).university_name || '');
      setTelegramUsername((user as any).telegram_username || '');
      setCgpa((user as any).cgpa || '');
      setTeachingExperience((user as any).teaching_experience || '1 – 2 Years');
      setChildrenGrades((user as any).children_grades || []);
      setPreferredTutorGender((user as any).preferred_tutor_gender || 'No Preference');
      setPreferredSessionFormat((user as any).preferred_session_format || 'Flexible / Either');

      // Fetch tutor record if user is an educator
      if (user.role === 'tutor' || (user as any)?.active_role === 'tutor') {
        supabase
          .from('tutors')
          .select('id, hourly_rate, subjects, is_online, is_in_person, bio')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setTutorRecordId(data.id);
              if (data.hourly_rate) setHourlyRate(String(data.hourly_rate));
              if (Array.isArray(data.subjects) && data.subjects.length > 0) {
                setTutorSubjects(data.subjects);
              } else if (Array.isArray(user.interested_subjects) && user.interested_subjects.length > 0) {
                setTutorSubjects(user.interested_subjects);
              }
              if (typeof data.is_online === 'boolean') setIsOnline(data.is_online);
              if (typeof data.is_in_person === 'boolean') setIsInPerson(data.is_in_person);
              if (data.bio && !user.academic_summary) setAcademicSummary(data.bio);
            }
          });
      }
    }
  }, [user]);

  const toggleGradeOption = (grade: string) => {
    setChildrenGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const toggleTutorSubject = (subj: string) => {
    setTutorSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!user) {
      setSaveError('Please sign in to update your profile.');
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setSaveError('Full name is required.');
      return;
    }

    if (!trimmedPhone) {
      setSaveError('Phone number is required.');
      return;
    }

    if (!validatePhone(trimmedPhone)) {
      setSaveError('Please enter a valid Ethiopian phone number (e.g. 0911234567 or 0712345678).');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        full_name: trimmedName,
        phone: trimmedPhone,
        city: city.trim() || null,
      };

      if (isTutor) {
        payload.living_address = livingAddress.trim() || null;
        payload.university_name = universityName.trim() || null;
        payload.telegram_username = telegramUsername.trim() || null;
        payload.cgpa = cgpa.trim() || null;
        payload.teaching_experience = teachingExperience;
        payload.academic_summary = academicSummary.trim() || null;
      } else if (isParent) {
        payload.living_address = livingAddress.trim() || null;
        payload.children_grades = childrenGrades;
        payload.preferred_tutor_gender = preferredTutorGender;
        payload.preferred_session_format = preferredSessionFormat;
        payload.academic_summary = academicSummary.trim() || null;
      } else {
        // Student role
        payload.grade_level = gradeLevel.trim() || null;
        payload.target_degree_level = targetDegree;
        payload.has_ielts = hasIelts;
        payload.academic_summary = academicSummary.trim() || null;
        const parsedGpa = gpa.trim() ? parseFloat(gpa.trim()) : null;
        if (parsedGpa !== null && !Number.isNaN(parsedGpa)) {
          payload.gpa = parsedGpa;
        }
      }

      await updateProfile(payload);

      // Update Tutors Table for Educators
      if (isTutor) {
        const parsedRate = Math.max(50, Math.round(parseFloat(hourlyRate.trim()) || 400));
        const tutorPayload: Record<string, any> = {
          user_id: user.id,
          hourly_rate: parsedRate,
          subjects: tutorSubjects,
          is_online: isOnline,
          is_in_person: isInPerson,
          bio: academicSummary.trim() || null,
        };

        if (tutorRecordId) {
          const { error: tErr } = await supabase
            .from('tutors')
            .update(tutorPayload)
            .eq('id', tutorRecordId);
          if (tErr) console.warn('Tutors table update error:', tErr);
        } else {
          const { data: newTutor, error: tErr } = await supabase
            .from('tutors')
            .upsert(tutorPayload, { onConflict: 'user_id' })
            .select('id')
            .maybeSingle();
          if (tErr) console.warn('Tutors table upsert error:', tErr);
          if (newTutor) setTutorRecordId(newTutor.id);
        }
      }

      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(getErrorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {isTutor
            ? 'Educator Profile'
            : isParent
            ? 'Parent Profile'
            : isAdmin
            ? 'Administrator Profile'
            : 'Student Profile'}
        </p>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Profile &amp; Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTutor
            ? 'Manage your tutor credentials, teaching background, and contact details for student matching.'
            : isParent
            ? 'Manage your family preferences, tutoring requirements, and communication contact details.'
            : 'Manage your personal details and academic credentials for scholarship matching and tutor pairing.'}
        </p>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>Your profile information has been saved successfully!</span>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-between text-rose-800 text-xs font-semibold shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Personal Details
          </h2>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs overflow-hidden flex-shrink-0">
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
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                Role: {role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Abebe Bikila"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address (Account ID)
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="e.g. 0911234567"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Standard Ethiopian mobile number (09... or 07...)</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                City / Region
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Addis Ababa"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 🎓 ROLE: Student Fields */}
        {isStudent && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap size={16} className="text-brand-blue" />
              <span>Academic Background &amp; Target Goals</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Target Degree Level
                </label>
                <select
                  value={targetDegree}
                  onChange={(e) => setTargetDegree(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                >
                  <option value="high_school">High School Diploma / Grade 12</option>
                  <option value="bachelors">Bachelor&apos;s Degree (Undergraduate)</option>
                  <option value="masters">Master&apos;s Degree (Graduate)</option>
                  <option value="phd">PhD / Doctorate</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Current School / University / Grade
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g. Grade 12 or Addis Ababa University 3rd year"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="ielts"
                  checked={hasIelts}
                  onChange={(e) => setHasIelts(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue border-slate-300"
                />
                <label htmlFor="ielts" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  I have taken IELTS / TOEFL English Proficiency Exam
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Academic Interests &amp; Career Summary
              </label>
              <textarea
                value={academicSummary}
                onChange={(e) => setAcademicSummary(e.target.value)}
                placeholder="Describe your academic interests, preferred majors (e.g. Computer Science, Public Health, Mechanical Engineering), and career aspirations..."
                rows={4}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
          </div>
        )}

        {/* 👨‍🏫 ROLE: Tutor Fields */}
        {isTutor && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-brand-blue" />
              <span>Tutor Credentials &amp; Experience</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Residence Sub-city / Neighborhood
                </label>
                <input
                  type="text"
                  value={livingAddress}
                  onChange={(e) => setLivingAddress(e.target.value)}
                  placeholder="e.g. Bole, CMC, Sarbet, Megenagna"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  University / College Attended
                </label>
                <input
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="e.g. Addis Ababa University (AAiT)"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Telegram Username (for quick booking alerts)
                </label>
                <div className="relative">
                  <Send size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Graduation CGPA / Academic Standing
                </label>
                <input
                  type="text"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 3.89 / 4.0 or Very Great Distinction"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Teaching Experience
                </label>
                <select
                  value={teachingExperience}
                  onChange={(e) => setTeachingExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                >
                  {TEACHING_EXPERIENCE_OPTIONS.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rates & Teaching Offerings */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Tutoring Rate &amp; Offerings
                </h3>
                <p className="text-[11px] text-slate-500">
                  Set your custom hourly rate and specify which subjects and modes you offer to students.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Hourly Tutoring Rate (ETB / hr) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ETB
                    </span>
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full pl-14 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    This amount is displayed directly to students on your profile card and during session booking.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Instruction Delivery Modes
                  </label>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOnline}
                        onChange={(e) => setIsOnline(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <Globe size={14} className="text-brand-blue" />
                        <span>Online Tutoring (Google Meet / Zoom)</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInPerson}
                        onChange={(e) => setIsInPerson(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <Home size={14} className="text-purple-600" />
                        <span>In-Person Tutoring (Addis Ababa)</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Teaching Subjects Selector */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Teaching Subjects (Click to select)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TUTOR_SUBJECTS.map((subj) => {
                    const isSelected = tutorSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleTutorSubject(subj)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-blue text-white shadow-2xs ring-1 ring-brand-blue'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isSelected && <Check size={13} className="text-white" />}
                        <span>{subj}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Professional Bio &amp; Tutoring Subjects
              </label>
              <textarea
                value={academicSummary}
                onChange={(e) => setAcademicSummary(e.target.value)}
                placeholder="Highlight your teaching methodology, top subjects (e.g. Calculus, Physics, SAT Math, Python), and student success track record..."
                rows={4}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
          </div>
        )}

        {/* 👨‍👩‍👧 ROLE: Parent Fields */}
        {isParent && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users size={16} className="text-brand-blue" />
              <span>Family &amp; Tutoring Preferences</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Residence Neighborhood / Sub-city
                </label>
                <input
                  type="text"
                  value={livingAddress}
                  onChange={(e) => setLivingAddress(e.target.value)}
                  placeholder="e.g. Bole, Old Airport, Sarbet, CMC, Ayat"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Preferred Tutor Gender
                </label>
                <select
                  value={preferredTutorGender}
                  onChange={(e) => setPreferredTutorGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                >
                  {PREFERRED_GENDER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Session Format
                </label>
                <select
                  value={preferredSessionFormat}
                  onChange={(e) => setPreferredSessionFormat(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                >
                  {SESSION_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Children Grade Levels
                </label>
                <div className="flex flex-wrap gap-2">
                  {CHILDREN_GRADE_OPTIONS.map((grade) => {
                    const isSelected = childrenGrades.includes(grade);
                    return (
                      <button
                        type="button"
                        key={grade}
                        onClick={() => toggleGradeOption(grade)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Special Tutoring Requirements &amp; Child Goals
              </label>
              <textarea
                value={academicSummary}
                onChange={(e) => setAcademicSummary(e.target.value)}
                placeholder="Mention any specific goals (e.g. National Exam Grade 12 prep, international school homework assistance, STEM focus)..."
                rows={4}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
          </div>
        )}

        {/* ⚙️ ROLE: Admin Notice */}
        {isAdmin && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Administrator Access</p>
              <p className="mt-0.5 text-slate-500">You are logged in with administrative privileges.</p>
            </div>
            <a
              href="https://admin.eaglespathway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Open Admin Console
            </a>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin text-brand-gold" />
            ) : (
              <Save size={15} />
            )}
            <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
