'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Users,
  UserPlus,
  GraduationCap,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Video,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import Link from 'next/link';

interface LinkedChild {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  grade_level?: string;
  target_major?: string;
  link_code?: string;
}

export default function ParentChildrenPage() {
  const { user } = useAuthStore();
  const [childrenList, setChildrenList] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [childApplications, setChildApplications] = useState<any[]>([]);
  const [childBookings, setChildBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Link Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);

  useEffect(() => {
    async function loadChildren() {
      if (!user?.id) return;
      try {
        const { data: links, error: linkErr } = await supabase
          .from('parent_student_links')
          .select('student_id, student:users!parent_student_links_student_id_fkey(*)')
          .eq('parent_id', user.id);

        if (!linkErr && links && links.length > 0) {
          const formatted: LinkedChild[] = links
            .map((l: any) => l.student)
            .filter(Boolean);
          setChildrenList(formatted);
          if (formatted.length > 0) {
            setSelectedChildId(formatted[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load linked children:', err);
      } finally {
        setLoading(false);
      }
    }
    loadChildren();
  }, [user?.id]);

  useEffect(() => {
    async function loadChildData() {
      if (!selectedChildId) return;
      try {
        const [appsRes, bookingsRes] = await Promise.all([
          supabase
            .from('applications')
            .select('*, scholarship:scholarships(*)')
            .eq('student_id', selectedChildId)
            .order('updated_at', { ascending: false }),
          supabase
            .from('bookings')
            .select('*, tutor:tutors(*)')
            .eq('student_id', selectedChildId)
            .order('session_date', { ascending: true }),
        ]);

        if (appsRes.data) setChildApplications(appsRes.data);
        if (bookingsRes.data) setChildBookings(bookingsRes.data);
      } catch (err) {
        console.warn('Failed to load child activity:', err);
      }
    }
    loadChildData();
  }, [selectedChildId]);

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    const code = linkCodeInput.trim().toUpperCase();

    if (!code) {
      setLinkError('Please enter your child\'s 6-character linking code or student phone number.');
      return;
    }

    setLinking(true);
    try {
      // Find student by link code or phone
      let studentQuery = supabase.from('users').select('*').limit(1);
      if (code.length === 6) {
        studentQuery = studentQuery.eq('link_code', code);
      } else {
        studentQuery = studentQuery.eq('phone', code);
      }

      const { data: matchedStudents, error: findErr } = await studentQuery;
      if (findErr || !matchedStudents || matchedStudents.length === 0) {
        setLinkError('No student account found matching this code or phone number.');
        return;
      }

      const student = matchedStudents[0];

      // Insert link
      const { error: insertErr } = await supabase.from('parent_student_links').insert({
        parent_id: user?.id,
        student_id: student.id,
      });

      if (insertErr && !insertErr.message.includes('unique')) {
        throw insertErr;
      }

      setChildrenList((prev) => [...prev, student]);
      setSelectedChildId(student.id);
      setLinkSuccess(true);
      setTimeout(() => {
        setShowLinkModal(false);
        setLinkSuccess(false);
        setLinkCodeInput('');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setLinkError('Failed to link child. Please verify the code and try again.');
    } finally {
      setLinking(false);
    }
  };

  const activeChild = childrenList.find((c) => c.id === selectedChildId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-[#0B2A5B]" size={26} />
            <span>Parent Portal: Children Progress</span>
          </h1>
          <p className="text-xs text-slate-500">
            Monitor your children&apos;s scholarship applications, attend upcoming tutoring sessions, and track their academic roadmap.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <UserPlus size={14} />
            <span>Link Another Child</span>
          </button>

          <Link
            href="/request-tutor"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs font-bold hover:brightness-105 shadow-sm"
          >
            <Sparkles size={14} />
            <span>Book a Tutor for My Child</span>
          </Link>
        </div>
      </div>

      {/* Children Switcher Pills */}
      {childrenList.length > 0 && (
        <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          {childrenList.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedChildId === child.id
                  ? 'bg-[#0B2A5B] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>👨‍🎓 {child.full_name}</span>
              {child.grade_level && (
                <span className="text-[10px] opacity-75 font-normal">({child.grade_level})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading children profiles...</div>
      ) : childrenList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0B2A5B] flex items-center justify-center mx-auto">
            <Users size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Linked Children Yet</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Link your child&apos;s Eagle Pathway account by entering their 6-character student code or registered phone number. You will be able to review their scholarship deadlines and booked tutoring hours.
          </p>

          <button
            onClick={() => setShowLinkModal(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] shadow-sm"
          >
            Link Child Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Child Overview Card */}
          {activeChild && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0B2A5B] text-[#C9A84C] font-black text-lg flex items-center justify-center">
                  {activeChild.full_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{activeChild.full_name}</h3>
                  <p className="text-xs text-slate-500">
                    {activeChild.grade_level || 'Student'} • Target:{' '}
                    {activeChild.target_major || 'Global Universities'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <div className="font-bold text-slate-900">{childApplications.length}</div>
                  <div className="text-[11px] text-slate-500">Applications</div>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-right">
                  <div className="font-bold text-emerald-700">{childBookings.length}</div>
                  <div className="text-[11px] text-slate-500">Tutoring Sessions</div>
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Split: Applications & Tutoring Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Child's Scholarship Applications */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase size={16} className="text-[#0B2A5B]" />
                  <span>Scholarship Applications ({childApplications.length})</span>
                </h3>
              </div>

              {childApplications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No applications added to tracker yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {childApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {app.scholarship?.name || app.scholarship_name || 'Scholarship'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Updated: {formatDate(app.updated_at || app.created_at)}
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0B2A5B]/10 text-[#0B2A5B] uppercase tracking-wider">
                        {app.status || 'Draft'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Child's Booked Tutoring Sessions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={16} className="text-[#0B2A5B]" />
                  <span>Tutoring Schedule &amp; Classes ({childBookings.length})</span>
                </h3>
              </div>

              {childBookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No upcoming tutoring sessions booked.
                </div>
              ) : (
                <div className="space-y-3">
                  {childBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {b.subject || '1-on-1 Tutoring Session'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {b.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Date: {formatDate(b.session_date)}</span>
                        <span>{b.duration_hours || 1} Hour Session</span>
                      </div>

                      {b.meeting_link && (
                        <a
                          href={b.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                        >
                          <Video size={12} />
                          <span>Join Google Meet Room</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setShowLinkModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#0B2A5B]/10 text-[#0B2A5B] flex items-center justify-center">
                <UserPlus size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Link Child Account</h3>
                <p className="text-[11px] text-slate-500">
                  Connect your child&apos;s account to monitor academic applications and sessions.
                </p>
              </div>
            </div>

            {linkSuccess ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle2 size={40} className="mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Child Linked Successfully!</h4>
              </div>
            ) : (
              <form onSubmit={handleLinkChild} className="space-y-4">
                {linkError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{linkError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Link Code (6 Characters) or Phone *
                  </label>
                  <input
                    type="text"
                    value={linkCodeInput}
                    onChange={(e) => setLinkCodeInput(e.target.value)}
                    placeholder="e.g. AB12CD or 0911234567"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your child can find their link code inside their mobile/web profile screen.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={linking}
                    className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] disabled:opacity-50"
                  >
                    {linking ? 'Verifying...' : 'Link Child'}
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

