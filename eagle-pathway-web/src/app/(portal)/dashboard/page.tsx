'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import type { Scholarship, Tutor, Application, Booking } from '@eagle-pathway/shared';
import {
  GraduationCap,
  Users,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Wallet,
  ClipboardList,
  Video,
  Award,
  Wand2,
  UserPlus,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { formatDate, differenceInDays } from '@/lib/date';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = (user?.role || 'student').toLowerCase();
  const isTutor = role === 'tutor';
  const isParent = role === 'parent';

  // Common State
  const [loading, setLoading] = useState(true);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Tutor-specific state
  const [tutorJobs, setTutorJobs] = useState<any[]>([]);
  const [tutorEarnings, setTutorEarnings] = useState({ total: 0, hours: 0 });

  // Parent-specific state
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        if (isTutor) {
          // Load Tutor Data
          const [jobsRes, bookingsRes, schedRes] = await Promise.all([
            supabase
              .from('tutor_job_posts')
              .select('*')
              .eq('status', 'open')
              .order('created_at', { ascending: false })
              .limit(4),
            supabase
              .from('bookings')
              .select('*, student:users(*)')
              .eq('tutor_id', user?.id)
              .order('session_date', { ascending: true })
              .limit(5),
            supabase
              .from('scholarships')
              .select('*')
              .order('deadline', { ascending: true })
              .limit(3),
          ]);

          setTutorJobs(jobsRes.data || []);
          setBookings((bookingsRes.data as any) || []);
          setScholarships((schedRes.data as any) || []);

          if (bookingsRes.data) {
            const completed = bookingsRes.data.filter((b: any) => b.status === 'completed');
            const total = completed.reduce((sum: number, b: any) => sum + (Number(b.total_amount) || 0), 0);
            const hours = completed.reduce((sum: number, b: any) => sum + (Number(b.duration_hours) || 1), 0);
            setTutorEarnings({ total, hours });
          }
        } else if (isParent) {
          // Load Parent Data
          const { data: links } = await supabase
            .from('parent_student_links')
            .select('student_id, student:users!parent_student_links_student_id_fkey(*)')
            .eq('parent_id', user?.id);

          const kids = (links || []).map((l: any) => l.student).filter(Boolean);
          setLinkedChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(kids[0].id);

            const [appsRes, booksRes] = await Promise.all([
              supabase
                .from('applications')
                .select('*, scholarship:scholarships(*)')
                .eq('student_id', kids[0].id)
                .limit(4),
              supabase
                .from('bookings')
                .select('*, tutor:tutors(*)')
                .eq('student_id', kids[0].id)
                .limit(4),
            ]);
            setApplications((appsRes.data as any) || []);
            setBookings((booksRes.data as any) || []);
          }

          const { data: tutorList } = await supabase
            .from('tutors')
            .select('*, user:users(*)')
            .eq('is_verified', true)
            .limit(3);
          setTutors((tutorList as any) || []);
        } else {
          // Load Student Data
          const [
            { data: sData },
            { data: tData },
            appsRes,
            booksRes,
          ] = await Promise.all([
            supabase
              .from('scholarships')
              .select('*')
              .order('deadline', { ascending: true })
              .limit(4),
            supabase
              .from('tutors')
              .select('*, user:users(*)')
              .eq('is_verified', true)
              .order('rating', { ascending: false })
              .limit(4),
            supabase
              .from('applications')
              .select('*, scholarship:scholarships(*)')
              .eq('student_id', user?.id)
              .order('updated_at', { ascending: false })
              .limit(4),
            supabase
              .from('bookings')
              .select('*, tutor:tutors(*, user:users(*))')
              .eq('student_id', user?.id)
              .order('session_date', { ascending: true })
              .limit(4),
          ]);

          setScholarships((sData as any) || []);
          setTutors((tData as any) || []);
          setApplications((appsRes.data as any) || []);
          setBookings((booksRes.data as any) || []);
        }
      } catch (err) {
        console.warn('Dashboard fetch notice:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id, role, isTutor, isParent]);

  // Greeting
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Scholar';
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // ==========================================
  // TUTOR DASHBOARD
  // ==========================================
  if (isTutor) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Tutor Hero Banner */}
        <div className="bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#C9A84C]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-bold mb-2">
                <ShieldCheck size={13} />
                <span>Verified Educator Workspace</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black">
                {timeGreeting}, {firstName}!
              </h1>
              <p className="text-xs md:text-sm text-slate-200 mt-1">
                You have {tutorJobs.length} open student tutoring requests waiting for proposals in Addis Ababa &amp; Online.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/tutor-jobs"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs font-bold hover:brightness-105 shadow-sm"
              >
                Browse Student Requests
              </Link>
              <Link
                href="/earnings"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Withdraw Funds
              </Link>
            </div>
          </div>
        </div>

        {/* Tutor KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Upcoming Sessions
            </span>
            <div className="text-2xl font-black text-slate-900">{bookings.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Confirmed student classes</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Open Tutoring Jobs
            </span>
            <div className="text-2xl font-black text-[#0B2A5B]">{tutorJobs.length}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Ready for proposals</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Earned
            </span>
            <div className="text-2xl font-black text-emerald-700">
              {tutorEarnings.total.toLocaleString()} <span className="text-xs font-normal">ETB</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Completed instruction</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Teaching Hours
            </span>
            <div className="text-2xl font-black text-slate-900">{tutorEarnings.hours} hrs</div>
            <div className="text-[11px] text-slate-400 mt-1">1-on-1 tutoring sessions</div>
          </div>
        </div>

        {/* 2-Column Grid: Open Student Requests & Upcoming Teaching Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Open Student Jobs */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList size={18} className="text-[#0B2A5B]" />
                <span>Open Student Requests</span>
              </h2>
              <Link
                href="/tutor-jobs"
                className="text-xs font-bold text-[#0B2A5B] hover:text-[#1E4D9B] flex items-center gap-1"
              >
                <span>View All Jobs</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {tutorJobs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No open student requests right now. Check back soon!
              </div>
            ) : (
              <div className="space-y-3">
                {tutorJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900">
                        {Array.isArray(job.subjects) ? job.subjects.join(', ') : 'All Subjects'}
                      </div>
                      <div className="text-slate-500 flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {job.place || 'Addis Ababa'}
                        </span>
                        <span>•</span>
                        <span>{job.grade || 'Grade 11-12'}</span>
                        <span>•</span>
                        <span className="font-bold text-emerald-700">{job.hourly_rate} ETB/hr</span>
                      </div>
                    </div>

                    <Link
                      href="/tutor-jobs"
                      className="px-4 py-2 rounded-xl bg-[#0B2A5B] text-white font-bold text-xs hover:bg-[#1E4D9B] text-center shadow-xs"
                    >
                      Apply to Job
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Upcoming Sessions */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-[#0B2A5B]" />
                <span>My Teaching Schedule</span>
              </h2>
              <Link
                href="/bookings"
                className="text-xs font-bold text-[#0B2A5B] hover:text-[#1E4D9B] flex items-center gap-1"
              >
                <span>Full Calendar</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No teaching appointments booked for this week.
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {b.subject || '1-on-1 Session'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                        {b.status}
                      </span>
                    </div>

                    <div className="text-slate-500 text-[11px] flex justify-between">
                      <span>Date: {formatDate(b.session_date)}</span>
                      <span>{b.duration_hours || 1} Hour</span>
                    </div>

                    {b.meeting_link && (
                      <a
                        href={b.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                      >
                        <Video size={12} />
                        <span>Join Google Meet</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PARENT DASHBOARD
  // ==========================================
  if (isParent) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Parent Hero Banner */}
        <div className="bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#C9A84C]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-bold mb-2">
                <span>Family &amp; Guardian Workspace</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black">
                {timeGreeting}, {firstName} 👨‍👩‍👧
              </h1>
              <p className="text-xs md:text-sm text-slate-200 mt-1">
                Monitor your children&apos;s scholarship progress, tutor attendance, and university admissions roadmap.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/request-tutor"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs font-bold hover:brightness-105 shadow-sm"
              >
                Book Tutor for Child
              </Link>
              <Link
                href="/parent/children"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Manage Children
              </Link>
            </div>
          </div>
        </div>

        {/* Parent KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Linked Children
            </span>
            <div className="text-2xl font-black text-slate-900">{linkedChildren.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Active student profiles</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Applications Tracked
            </span>
            <div className="text-2xl font-black text-[#0B2A5B]">{applications.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">University submissions</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Upcoming Classes
            </span>
            <div className="text-2xl font-black text-emerald-700">{bookings.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Tutoring sessions scheduled</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Admissions Guides
            </span>
            <div className="text-2xl font-black text-slate-900">12+</div>
            <div className="text-[11px] text-slate-400 mt-1">Parent SAT &amp; Aid Toolkits</div>
          </div>
        </div>

        {/* Linked Children Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-[#0B2A5B]" />
              <span>Children Academic Roadmap</span>
            </h2>
            <Link
              href="/parent/children"
              className="text-xs font-bold text-[#0B2A5B] hover:text-[#1E4D9B] flex items-center gap-1"
            >
              <span>View Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {linkedChildren.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 max-w-sm mx-auto space-y-3">
              <UserPlus size={28} className="mx-auto text-slate-400" />
              <p>No children linked yet. Connect your child&apos;s account to monitor their applications.</p>
              <Link
                href="/parent/children"
                className="inline-block px-4 py-2 rounded-xl bg-[#0B2A5B] text-white font-bold text-xs"
              >
                Link Child Account
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedChildren.map((kid) => (
                <div
                  key={kid.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B2A5B] text-[#C9A84C] font-bold text-sm flex items-center justify-center">
                      {kid.full_name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{kid.full_name}</div>
                      <div className="text-[11px] text-slate-500">{kid.grade_level || 'Student'}</div>
                    </div>
                  </div>

                  <Link
                    href="/parent/children"
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-[#0B2A5B] hover:bg-slate-50"
                  >
                    View Status
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // STUDENT DASHBOARD (Default)
  // ==========================================
  const urgentDeadlineScholarship = scholarships.find((s) => {
    if (!s.deadline) return false;
    const days = differenceInDays(s.deadline);
    return days >= 0 && days <= 30;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Student Hero Banner */}
      <div className="bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#C9A84C]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-bold border border-white/10 backdrop-blur-xs">
              <Sparkles size={13} />
              <span>International Education &amp; Tutoring Portal</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              {timeGreeting}, {firstName}!
            </h1>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
              Explore 100+ verified scholarships, connect with expert STEM and English educators, and craft winning statements of purpose with Eagle AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            <Link
              href="/request-tutor"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs font-bold hover:brightness-105 transition-all text-center shadow-sm"
            >
              Request 1-on-1 Tutor
            </Link>
            <Link
              href="/scholarships"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold text-center border border-white/20 transition-all"
            >
              Browse Scholarships
            </Link>
          </div>
        </div>
      </div>

      {/* Urgent Deadline Alert */}
      {urgentDeadlineScholarship && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                Application Deadline Approaching: {urgentDeadlineScholarship.name}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                Closes in {differenceInDays(urgentDeadlineScholarship.deadline!)} days (
                {formatDate(urgentDeadlineScholarship.deadline!)}).
              </div>
            </div>
          </div>
          <Link
            href={`/scholarships/${urgentDeadlineScholarship.id}`}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex-shrink-0"
          >
            Review &amp; Apply
          </Link>
        </div>
      )}

      {/* AI Suite Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/tools/sop"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0B2A5B]/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B2A5B]/10 text-[#0B2A5B] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award size={18} />
            </div>
            <span className="text-[10px] font-bold text-[#9A7B2C] bg-[#C9A84C]/15 px-2 py-0.5 rounded-full">
              AI Powered
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#0B2A5B] transition-colors">
            AI SOP Reviewer
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Committee scoring, strength highlights, and line-by-line rewrite suggestions.
          </p>
        </Link>

        <Link
          href="/tools/interview"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0B2A5B]/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles size={18} />
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              Mock Simulator
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#0B2A5B] transition-colors">
            Scholarship Mock Interview
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Simulate 5 realistic committee questions with real-time feedback and sample answers.
          </p>
        </Link>

        <Link
          href="/tools/magic-draft"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0B2A5B]/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wand2 size={18} />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Instant Drafter
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#0B2A5B] transition-colors">
            Magic Draft
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Generate an authentic, high-impact personal statement tailored to your background.
          </p>
        </Link>
      </div>

      {/* Featured Scholarships & Top Educators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Featured Scholarships */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-[#0B2A5B]" />
              <span>Featured Scholarships</span>
            </h2>
            <Link
              href="/scholarships"
              className="text-xs font-bold text-[#0B2A5B] hover:text-[#1E4D9B] flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scholarships.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                href={`/scholarships/${s.id}`}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0B2A5B]/30 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {s.country || 'Global'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {s.funding_type || 'Full'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">{s.organization}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Deadline: {s.deadline ? formatDate(s.deadline) : 'Rolling'}</span>
                  <ArrowRight size={13} className="text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Top Verified Educators */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-[#0B2A5B]" />
              <span>Top Verified Educators</span>
            </h2>
            <Link
              href="/tutors"
              className="text-xs font-bold text-[#0B2A5B] hover:text-[#1E4D9B] flex items-center gap-1"
            >
              <span>Browse All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {tutors.slice(0, 3).map((t: any) => (
              <Link
                key={t.id}
                href={`/tutors/${t.id}`}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-[#0B2A5B]/30 hover:shadow-md transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0B2A5B] text-[#C9A84C] font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {t.user?.full_name ? t.user.full_name[0] : 'T'}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{t.user?.full_name || 'Educator'}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {t.subjects?.join(', ') || 'Math, Physics, English'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                      <Star size={11} fill="currentColor" />
                      <span>{t.rating || '4.9'}</span>
                      <span className="text-slate-400 font-normal">({t.total_reviews || 15} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-xs text-slate-900">{t.hourly_rate || 500} ETB</span>
                  <span className="text-[10px] text-slate-400 block">/ hour</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
