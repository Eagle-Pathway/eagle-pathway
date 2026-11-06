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
      <div className="space-y-6 pb-16">
        {/* Tutor Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
              <ShieldCheck size={14} />
              <span>Verified Educator Workspace</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {timeGreeting}, {firstName}!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              You have {tutorJobs.length} open student tutoring requests waiting for proposals in Addis Ababa &amp; Online.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/tutor-jobs"
              className="px-3.5 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs transition-colors"
            >
              Browse Student Requests
            </Link>
            <Link
              href="/earnings"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors"
            >
              Earnings &amp; Payouts
            </Link>
          </div>
        </div>

        {/* Tutor KPI Cards (Admin Overview Sparkline Standard) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Upcoming Sessions
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Active
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{bookings.length}</span>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">Confirmed student classes</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Open Tutoring Jobs
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60">
                Live
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{tutorJobs.length}</span>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">Ready for proposals</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Total Earned
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                ETB
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {tutorEarnings.total.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">Completed instruction</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Teaching Hours
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                Logged
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{tutorEarnings.hours} hrs</span>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">1-on-1 tutoring sessions</span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Open Student Requests & Upcoming Teaching Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Open Student Jobs */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-blue" />
                <h3 className="text-sm font-bold text-slate-900">Open Student Requests</h3>
              </div>
              <Link
                href="/tutor-jobs"
                className="text-xs font-semibold text-brand-blue hover:text-brand-blue/80 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {tutorJobs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No open student requests right now. Check back soon!
              </div>
            ) : (
              <div className="space-y-2.5">
                {tutorJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">
                        {Array.isArray(job.subjects) ? job.subjects.join(', ') : 'All Subjects'}
                      </div>
                      <div className="text-slate-500 flex items-center gap-2.5 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" /> {job.place || 'Addis Ababa'}
                        </span>
                        <span>•</span>
                        <span>{job.grade || 'Grade 11-12'}</span>
                        <span>•</span>
                        <span className="font-bold text-emerald-700">{job.hourly_rate} ETB/hr</span>
                      </div>
                    </div>

                    <Link
                      href="/tutor-jobs"
                      className="px-3.5 py-1.5 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue/90 text-center shadow-xs self-start sm:self-auto"
                    >
                      Apply
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Upcoming Sessions */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">My Teaching Schedule</h3>
              </div>
              <Link
                href="/bookings"
                className="text-xs font-semibold text-brand-blue hover:text-brand-blue/80 flex items-center gap-1"
              >
                <span>Full Schedule</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No sessions booked yet. Apply to jobs to schedule classes.
              </div>
            ) : (
              <div className="space-y-2.5">
                {bookings.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {b.student?.full_name || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {b.session_date ? formatDate(b.session_date) : 'Scheduled Date'}
                      </div>
                    </div>

                    {b.meeting_link && (
                      <a
                        href={b.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-xs"
                      >
                        <Video size={12} />
                        <span>Meet</span>
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
      <div className="space-y-6 pb-16">
        {/* Parent Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
              <Users size={14} />
              <span>Family &amp; Guardian Workspace</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {timeGreeting}, {firstName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monitor your children&apos;s scholarship progress, tutor attendance, and university admissions roadmap.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/request-tutor"
              className="px-3.5 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs transition-colors"
            >
              Book Tutor for Child
            </Link>
            <Link
              href="/parent/children"
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors"
            >
              Manage Children
            </Link>
          </div>
        </div>

        {/* Parent KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Linked Children
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60">
                Profiles
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{linkedChildren.length}</span>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">Active student accounts</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Applications Tracked
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Tracked
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{applications.length}</span>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">University submissions</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Upcoming Classes
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Sessions
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{bookings.length}</span>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">Tutoring sessions scheduled</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                Admissions Guides
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                Resources
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">12+</span>
              <span className="text-xs text-slate-400 font-medium block mt-0.5">Parent SAT &amp; Aid Toolkits</span>
            </div>
          </div>
        </div>

        {/* Linked Children Overview */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-bold text-slate-900">Children Academic Roadmap</h3>
            </div>
            <Link
              href="/parent/children"
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue/80 flex items-center gap-1"
            >
              <span>Manage Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {linkedChildren.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 max-w-sm mx-auto space-y-3">
              <UserPlus size={28} className="mx-auto text-slate-400" />
              <p>No children linked yet. Connect your child&apos;s account to monitor their applications.</p>
              <Link
                href="/parent/children"
                className="inline-block px-4 py-2 rounded-xl bg-brand-blue text-white font-semibold text-xs shadow-xs"
              >
                Link Child Account
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {linkedChildren.map((kid) => (
                <div
                  key={kid.id}
                  className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-gold/20 text-brand-gold font-bold flex items-center justify-center flex-shrink-0">
                      {kid.full_name ? kid.full_name[0] : 'S'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{kid.full_name}</div>
                      <div className="text-[11px] text-slate-500">{kid.email}</div>
                    </div>
                  </div>
                  <Link
                    href={`/parent/children?id=${kid.id}`}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 text-xs shadow-xs"
                  >
                    View Progress
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
    <div className="space-y-6 pb-16">
      {/* Student Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Sparkles size={14} className="text-brand-gold" />
            <span>International Education &amp; Tutoring Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {timeGreeting}, {firstName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore 100+ verified scholarships, connect with expert STEM and English educators, and craft winning statements of purpose with Eagle AI.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/request-tutor"
            className="px-3.5 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs transition-colors"
          >
            Request 1-on-1 Tutor
          </Link>
          <Link
            href="/scholarships"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors"
          >
            Browse Scholarships
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards (Matching Admin Sparkline Card Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Verified Scholarships
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Active
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {scholarships.length > 0 ? `${scholarships.length}+` : '100+'}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">International funding opportunities</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Active Applications
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60">
              Pipeline
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{applications.length}</span>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">Tracked university admissions</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Tutoring Sessions
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Scheduled
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{bookings.length}</span>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">1-on-1 expert classes</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Verified Educators
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              Available
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {tutors.length > 0 ? `${tutors.length}+` : '75+'}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">Top STEM &amp; Language mentors</span>
          </div>
        </div>
      </div>

      {/* Urgent Deadline Alert */}
      {urgentDeadlineScholarship && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock size={18} />
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
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 flex-shrink-0 shadow-xs"
          >
            Review
          </Link>
        </div>
      )}

      {/* AI Suite Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Link
          href="/tools/sop"
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award size={16} />
            </div>
            <span className="text-[10px] font-semibold text-brand-blue bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded">
              AI Reviewer
            </span>
          </div>
          <h3 className="font-semibold text-xs text-slate-900 group-hover:text-brand-blue transition-colors">
            AI SOP Reviewer
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Committee scoring, strength highlights, and line-by-line rewrite suggestions.
          </p>
        </Link>

        <Link
          href="/tools/interview"
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles size={16} />
            </div>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/60 px-1.5 py-0.5 rounded">
              Mock Simulator
            </span>
          </div>
          <h3 className="font-semibold text-xs text-slate-900 group-hover:text-brand-blue transition-colors">
            Scholarship Mock Interview
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Simulate 5 realistic committee questions with real-time feedback and sample answers.
          </p>
        </Link>

        <Link
          href="/tools/magic-draft"
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wand2 size={16} />
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
              Magic Drafter
            </span>
          </div>
          <h3 className="font-semibold text-xs text-slate-900 group-hover:text-brand-blue transition-colors">
            Magic Draft
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Generate an authentic, high-impact personal statement tailored to your background.
          </p>
        </Link>
      </div>

      {/* Featured Scholarships & Top Educators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Featured Scholarships */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-bold text-slate-900">Featured Scholarships</h3>
            </div>
            <Link
              href="/scholarships"
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue/80 flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {scholarships.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                href={`/scholarships/${s.id}`}
                className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {s.country || 'Global'}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                      {s.funding_type || 'Full'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">
                    {s.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.organization}</p>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Deadline: {s.deadline ? formatDate(s.deadline) : 'Rolling'}</span>
                  <ArrowRight size={13} className="text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Top Verified Educators */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Top Verified Educators</h3>
            </div>
            <Link
              href="/tutors"
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue/80 flex items-center gap-1"
            >
              <span>Browse All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {tutors.slice(0, 3).map((t: any) => (
              <Link
                key={t.id}
                href={`/tutors/${t.id}`}
                className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-gold/20 text-brand-gold font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {t.user?.full_name ? t.user.full_name[0] : 'T'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">{t.user?.full_name || 'Educator'}</h4>
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
