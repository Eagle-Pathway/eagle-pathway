'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  Eye, 
  XCircle, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  DollarSign, 
  Bell, 
  Phone, 
  CheckCircle, 
  Copy, 
  Edit3, 
  Share2, 
  Send, 
  UserCheck, 
  Check, 
  ChevronRight,
  Sparkles,
  PhoneCall,
  Calendar,
  Layers,
  GraduationCap,
  X
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useToast } from '@/components/ui/Feedback';

interface JobPost {
  id: string;
  created_at: string;
  place: string;
  grade: string;
  mode?: string;
  subjects: string[];
  session_hours: number;
  days_per_week: number;
  start_time: string;
  hourly_rate: number;
  gender_preference?: string;
  status: 'submitted' | 'verified' | 'open' | 'hired' | 'closed';
  posted_by?: string;
  requester_name?: string;
  requester_phone?: string;
  notes?: string;
  tutor_id?: string;
  hired_tutor_id?: string;
  verified_at?: string;
  // Joins
  requested_tutor?: {
    id: string;
    user?: {
      full_name: string;
      email: string;
      phone?: string;
    };
  };
  hired_tutor?: {
    id: string;
    user?: {
      full_name: string;
      email: string;
      phone?: string;
    };
  };
  applicant_count?: number;
}

interface JobApplication {
  id: string;
  job_post_id: string;
  applicant_id: string;
  status: 'applied' | 'shortlisted' | 'rejected' | 'hired';
  education_status?: string;
  living_address?: string;
  university_name?: string;
  phone_number?: string;
  telegram_username?: string;
  cgpa?: string;
  cover_letter?: string;
  created_at: string;
  applicant?: {
    full_name: string;
    phone: string;
    email: string;
  };
}

const DEFAULT_SUBJECTS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Amharic',
  'History', 'Geography', 'Civics', 'Economics', 'Business', 'ICT/Computer',
  'SAT', 'IELTS', 'TOEFL', 'French', 'Arabic', 'Chinese',
  'Music', 'Art', 'Physical Education', 'General Tutoring',
];

const DAYS_LIST = [
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' },
  { full: 'Sunday', short: 'Sun' },
];

export default function TutorJobsPage() {
  const showToast = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'submitted' | 'open' | 'direct' | 'closed'>('submitted');

  // Modals & Panels
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New / Edit Job Form State
  const [formData, setFormData] = useState({
    place: '',
    grade: '',
    mode: 'Hybrid',
    subjects: [] as string[],
    selectedDays: [] as string[],
    session_hours: '2',
    days_per_week: '3',
    start_time: '4 LT',
    hourly_rate: '500',
    gender_preference: 'both',
    requester_name: '',
    requester_phone: '',
    notes: '',
  });

  const [customSubject, setCustomSubject] = useState('');

  async function fetchJobs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutor_job_posts')
        .select(`
          *,
          requested_tutor:tutors!tutor_job_posts_tutor_id_fkey(id, user:users(full_name, email, phone)),
          hired_tutor:tutors!tutor_job_posts_hired_tutor_id_fkey(id, user:users(full_name, email, phone))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        const { data: fallbackData } = await supabase
          .from('tutor_job_posts')
          .select('*')
          .order('created_at', { ascending: false });
        setJobs((fallbackData as JobPost[]) || []);
      } else {
        setJobs((data as unknown as JobPost[]) || []);
      }
    } catch (err) {
      console.error('Failed to load tutor jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchApplicants(jobId: string) {
    setLoadingApplicants(true);
    const { data, error } = await supabase
      .from('tutor_job_applications')
      .select('*, applicant:users(full_name, phone, email)')
      .eq('job_post_id', jobId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplicants(data as unknown as JobApplication[]);
    }
    setLoadingApplicants(false);
  }

  // Format Telegram Channel Post Block
  function generateTelegramBlock(job: JobPost): string {
    const isClosed = job.status === 'hired' || job.status === 'closed';
    const headerTag = isClosed ? '#Closed' : '#Open';
    const modeTag = job.mode ? `[${job.mode.toUpperCase()}]` : '[HYBRID]';
    const subjectsStr = (job.subjects || []).join(', ') || 'General Subjects';

    return `${headerTag}

  ✅ Place: ${job.place || 'Addis Ababa'}
  ✅ Grade : ${job.grade || 'Any'} Level
  ✅ 📍 Online or in-person ${modeTag}
  ✅ Subject : ${subjectsStr}
  ✅ Session : ${job.session_hours || 2}hr/day
  ✅ Days : ${job.days_per_week || 3} days/week
  ✅ Start Time : ${job.start_time || '4 LT'}
  ✅ Hourly amount : ${job.hourly_rate || 500} birr / hr

🗓 Available to start immediately

  To Apply, Contact 👉@eagle_tutorials_services
Join Our Channel: https://t.me/EagleTutorialsServices`;
  }

  async function handleCopyTelegram(job: JobPost) {
    const text = generateTelegramBlock(job);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(job.id);
      showToast('success', 'Telegram post copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('error', 'Could not copy to clipboard.');
    }
  }

  // Approve & Publish to Open Jobs
  async function handleApproveAndPublish(job: JobPost) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('tutor_job_posts')
        .update({ 
          status: 'open',
          verified_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (error) throw error;

      showToast('success', 'Job published to open jobs board! 🚀');
      fetchJobs();

      // Trigger push notifications to approved tutors in background
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        fetch('/api/notify-new-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ job_post_id: job.id }),
        }).catch(console.error);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to publish job.');
    } finally {
      setActionLoading(false);
    }
  }

  // Add Custom Subject
  function handleAddCustomSubject() {
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    if (!formData.subjects.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, trimmed],
      }));
    }
    setCustomSubject('');
  }

  // Toggle Day Selection
  function toggleDay(dayShort: string) {
    setFormData(prev => {
      const exists = prev.selectedDays.includes(dayShort);
      const nextDays = exists 
        ? prev.selectedDays.filter(d => d !== dayShort)
        : [...prev.selectedDays, dayShort];
      
      return {
        ...prev,
        selectedDays: nextDays,
        days_per_week: nextDays.length > 0 ? nextDays.length.toString() : prev.days_per_week,
      };
    });
  }

  // Save / Update Job
  async function handleSaveJob(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.place || !formData.grade || !formData.subjects.length || !formData.requester_phone) {
      showToast('error', 'Please fill in Place, Grade, Phone, and at least one Subject.');
      return;
    }

    setActionLoading(true);
    try {
      const daysInfo = formData.selectedDays.length > 0
        ? `${formData.selectedDays.join(', ')} (${formData.days_per_week} days/wk)`
        : `${formData.days_per_week} days/week`;

      const payload = {
        place: formData.place.trim(),
        grade: formData.grade.trim(),
        mode: formData.mode,
        subjects: formData.subjects,
        session_hours: parseFloat(formData.session_hours) || 2,
        days_per_week: parseInt(formData.days_per_week, 10) || (formData.selectedDays.length || 3),
        start_time: formData.start_time.trim() || '4 LT',
        hourly_rate: parseFloat(formData.hourly_rate) || 500,
        gender_preference: formData.gender_preference,
        requester_name: formData.requester_name.trim() || null,
        requester_phone: formData.requester_phone.trim(),
        notes: formData.selectedDays.length > 0 
          ? (formData.notes ? `${formData.notes} | Preferred Days: ${formData.selectedDays.join(', ')}` : `Preferred Days: ${formData.selectedDays.join(', ')}`)
          : (formData.notes.trim() || null),
      };

      if (editingJob) {
        const { error } = await supabase
          .from('tutor_job_posts')
          .update(payload)
          .eq('id', editingJob.id);
        if (error) throw error;
        showToast('success', 'Job post updated successfully!');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('tutor_job_posts')
          .insert({
            ...payload,
            posted_by: user?.id,
            status: 'submitted',
          });
        if (error) throw error;
        showToast('success', 'New tutor request created!');
      }

      setShowNewModal(false);
      setEditingJob(null);
      fetchJobs();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save job post.');
    } finally {
      setActionLoading(false);
    }
  }

  // Hire Tutor & Exchange Contacts
  async function handleHireTutor(job: JobPost, application: JobApplication) {
    if (!confirm(`Are you sure you want to hire ${application.applicant?.full_name || 'this tutor'} for this job?`)) return;

    setActionLoading(true);
    try {
      await supabase
        .from('tutor_job_applications')
        .update({ status: 'hired' })
        .eq('id', application.id);

      await supabase
        .from('tutor_job_posts')
        .update({ 
          status: 'hired',
          hired_tutor_id: application.applicant_id 
        })
        .eq('id', job.id);

      const tutorPhone = application.phone_number || application.applicant?.phone || 'Contact via Admin';
      const tutorTg = application.telegram_username ? `@${application.telegram_username.replace('@', '')}` : 'N/A';
      const parentPhone = job.requester_phone || 'Parent Phone on File';

      if (job.posted_by) {
        await supabase.from('notifications').insert({
          user_id: job.posted_by,
          title: 'Tutor Assigned! 🎓',
          body: `We have hired ${application.applicant?.full_name || 'a verified tutor'} for your ${job.grade} request. Tutor Contact: ${tutorPhone} (Telegram: ${tutorTg}).`,
          type: 'tutor_hired',
          is_read: false,
        });
      }

      await supabase.from('notifications').insert({
        user_id: application.applicant_id,
        title: 'You are Hired! 🎉',
        body: `Congratulations! You have been selected for the ${job.grade} tutoring job in ${job.place}. Parent Phone: ${parentPhone}.`,
        type: 'tutor_hired',
        is_read: false,
      });

      showToast('success', `Hired ${application.applicant?.full_name || 'Tutor'} and exchanged contact details! 🤝`);
      fetchJobs();
      if (selectedJob) fetchApplicants(selectedJob.id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to complete hiring.');
    } finally {
      setActionLoading(false);
    }
  }

  const openEditModal = (job: JobPost) => {
    setEditingJob(job);
    setFormData({
      place: job.place || '',
      grade: job.grade || '',
      mode: job.mode || 'Hybrid',
      subjects: job.subjects || [],
      selectedDays: [],
      session_hours: (job.session_hours || 2).toString(),
      days_per_week: (job.days_per_week || 3).toString(),
      start_time: job.start_time || '4 LT',
      hourly_rate: (job.hourly_rate || 500).toString(),
      gender_preference: job.gender_preference || 'both',
      requester_name: job.requester_name || '',
      requester_phone: job.requester_phone || '',
      notes: job.notes || '',
    });
    setCustomSubject('');
    setShowNewModal(true);
  };

  function toggleSubject(subject: string) {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  }

  // Filtered by Search & Tab
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch =
        j.place?.toLowerCase().includes(search.toLowerCase()) ||
        j.grade?.toLowerCase().includes(search.toLowerCase()) ||
        j.requester_name?.toLowerCase().includes(search.toLowerCase()) ||
        j.requester_phone?.toLowerCase().includes(search.toLowerCase()) ||
        j.subjects?.some(s => s.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'submitted') return j.status === 'submitted' || j.status === 'verified';
      if (activeTab === 'open') return j.status === 'open' && !j.tutor_id;
      if (activeTab === 'direct') return !!j.tutor_id;
      if (activeTab === 'closed') return j.status === 'hired' || j.status === 'closed';
      return true;
    });
  }, [jobs, search, activeTab]);

  // Tab Counts
  const counts = useMemo(() => {
    const submitted = jobs.filter(j => j.status === 'submitted' || j.status === 'verified').length;
    const open = jobs.filter(j => j.status === 'open' && !j.tutor_id).length;
    const direct = jobs.filter(j => !!j.tutor_id).length;
    const closed = jobs.filter(j => j.status === 'hired' || j.status === 'closed').length;
    return { submitted, open, direct, closed };
  }, [jobs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tutor Job Board & Matching</h1>
          <p className="mt-1 text-sm text-gray-500">Verify parent requests, broadcast jobs, review tutor applications, and hire</p>
        </div>

        <button
          onClick={() => {
            setEditingJob(null);
            setFormData({
              place: '',
              grade: '',
              mode: 'Hybrid',
              subjects: [],
              selectedDays: [],
              session_hours: '2',
              days_per_week: '3',
              start_time: '4 LT',
              hourly_rate: '500',
              gender_preference: 'both',
              requester_name: '',
              requester_phone: '',
              notes: '',
            });
            setCustomSubject('');
            setShowNewModal(true);
          }}
          className="flex items-center px-4 py-2.5 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 transition-colors text-sm font-bold shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Post New Request
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-gray-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('submitted')}
          className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'submitted'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PhoneCall className="w-4 h-4 mr-2" />
          Pending Phone Verification ({counts.submitted})
        </button>

        <button
          onClick={() => setActiveTab('open')}
          className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'open'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Open Job Broadcasts ({counts.open})
        </button>

        <button
          onClick={() => setActiveTab('direct')}
          className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'direct'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Direct Tutor Requests ({counts.direct})
        </button>

        <button
          onClick={() => setActiveTab('closed')}
          className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'closed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Hired & Closed ({counts.closed})
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by location, grade, phone, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-500">
          Loading tutor job requests...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-500">
          No job requests found in this section.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => {
            const isPendingVerification = job.status === 'submitted' || job.status === 'verified';
            const isOpen = job.status === 'open';
            const isHired = job.status === 'hired' || job.status === 'closed';

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Status & Date Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      isPendingVerification
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        : isOpen
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {job.status === 'submitted' ? 'Needs Phone Call' : job.status}
                    </span>

                    <span className="text-[11px] text-gray-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title / Grade & Location */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-900 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1.5 text-brand-blue" />
                      Grade {job.grade} Level
                    </h3>
                    <p className="text-xs text-gray-600 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" />
                      {job.place} {job.mode && <span className="ml-1 text-[10px] font-bold uppercase text-brand-blue">({job.mode})</span>}
                    </p>
                  </div>

                  {/* Requester Phone & Contact Bar */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Requester Phone</span>
                      {job.requester_phone ? (
                        <a
                          href={`tel:${job.requester_phone}`}
                          className="flex items-center text-xs font-bold text-brand-blue hover:underline"
                        >
                          <Phone className="w-3 h-3 mr-1 text-emerald-600" />
                          {job.requester_phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">No phone</span>
                      )}
                    </div>
                    {job.requester_name && (
                      <p className="text-xs text-gray-700 font-medium">Name: {job.requester_name}</p>
                    )}
                  </div>

                  {/* Subjects */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(job.subjects || []).map((subj) => (
                      <span
                        key={subj}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-brand-blue"
                      >
                        {subj}
                      </span>
                    ))}
                  </div>

                  {/* Logistics Strip */}
                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Schedule</span>
                      <span className="font-bold">{job.session_hours}h/day · {job.days_per_week}d/wk</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Hourly Rate</span>
                      <span className="font-bold text-emerald-600">{job.hourly_rate} ETB/hr</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {job.notes && (
                    <p className="mt-2 text-xs text-gray-500 italic bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                      &ldquo;{job.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    {/* Copy Telegram Block Button */}
                    <button
                      onClick={() => handleCopyTelegram(job)}
                      className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      title="Copy Telegram Channel Template"
                    >
                      {copiedId === job.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1 text-gray-500" />
                          Copy Telegram Post
                        </>
                      )}
                    </button>

                    {/* Edit Job Button */}
                    <button
                      onClick={() => openEditModal(job)}
                      className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Job Logistics"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Tab-Specific Actions */}
                  {isPendingVerification && (
                    <div className="flex gap-2">
                      <a
                        href={`tel:${job.requester_phone}`}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                        Call Requester
                      </a>
                      <button
                        onClick={() => handleApproveAndPublish(job)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-bold text-white bg-brand-blue hover:bg-blue-800 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Approve & Publish
                      </button>
                    </div>
                  )}

                  {isOpen && (
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        fetchApplicants(job.id);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2 text-xs font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      View Applicants
                    </button>
                  )}

                  {isHired && (
                    <div className="text-center py-1 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                      Matched & Closed (#Closed)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applicants Review & Hire Drawer Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Tutor Applicants for Grade {selectedJob.grade}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedJob.place} · {selectedJob.hourly_rate} ETB/hr · {applicants.length} Applicant(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicants List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingApplicants ? (
                <p className="text-center text-sm text-gray-400 py-8">Loading applicants...</p>
              ) : applicants.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">No applicants yet</p>
                  <p className="text-xs text-gray-400 mt-1">Make sure you copied the post to your Telegram channel and push notification was sent.</p>
                </div>
              ) : (
                applicants.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-brand-blue/40 transition-all space-y-3 bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center text-sm">
                          {app.applicant?.full_name?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{app.applicant?.full_name}</h4>
                          <p className="text-xs text-gray-500">{app.applicant?.email}</p>
                        </div>
                      </div>

                      {app.status === 'hired' ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hired 🎓
                        </span>
                      ) : (
                        <button
                          onClick={() => handleHireTutor(selectedJob, app)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                          Hire This Tutor
                        </button>
                      )}
                    </div>

                    {/* Meta Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-gray-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-gray-400 block font-semibold">Phone</span>
                        <span className="font-bold text-gray-800">{app.phone_number || app.applicant?.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Telegram</span>
                        <span className="font-bold text-brand-blue">{app.telegram_username ? `@${app.telegram_username.replace('@', '')}` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">University/CGPA</span>
                        <span className="font-bold text-gray-800">{app.university_name || 'Grad'} ({app.cgpa || '3.5+'})</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Location</span>
                        <span className="font-bold text-gray-800">{app.living_address || 'Addis Ababa'}</span>
                      </div>
                    </div>

                    {/* Cover Letter / Pitch */}
                    {app.cover_letter && (
                      <p className="text-xs text-gray-700 italic bg-blue-50/40 p-2.5 rounded-xl border border-blue-100">
                        &ldquo;{app.cover_letter}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Job Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">
                {editingJob ? 'Edit Tutor Request Logistics' : 'Create New Tutor Job Request'}
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveJob} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Requester Phone *</label>
                  <input
                    type="tel"
                    placeholder="0911223344"
                    value={formData.requester_phone}
                    onChange={(e) => setFormData({ ...formData, requester_phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Requester Name</label>
                  <input
                    type="text"
                    placeholder="Parent / Student Name"
                    value={formData.requester_name}
                    onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Place / Location *</label>
                  <input
                    type="text"
                    placeholder="E.g., Kality Maremiya/Gebriel"
                    value={formData.place}
                    onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Grade Level *</label>
                  <input
                    type="text"
                    placeholder="E.g., 11 Level, Grade 9, University"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="In-person">In-person</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Hours / Day</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.session_hours}
                    onChange={(e) => setFormData({ ...formData, session_hours: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              {/* Select Days of the Week */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Select Days of Week {formData.selectedDays.length > 0 && `(${formData.selectedDays.length} days/week)`}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_LIST.map((day) => {
                    const isSelected = formData.selectedDays.includes(day.short);
                    return (
                      <button
                        type="button"
                        key={day.short}
                        onClick={() => toggleDay(day.short)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="E.g., 4 LT or 10:00 AM"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Hourly Rate (ETB) *</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              {/* Subjects Picker + Custom Subject Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Subjects *</label>
                
                {/* Custom Subject Write-in */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write custom subject (if not listed below)..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubject();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
                  >
                    + Add Subject
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50/50">
                  {/* Selected / Custom Subjects */}
                  {formData.subjects.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSubject(s)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-blue text-white shadow-sm flex items-center gap-1"
                    >
                      {s}
                      <span className="text-[10px] opacity-75">✕</span>
                    </button>
                  ))}

                  {/* Unselected Default Subjects */}
                  {DEFAULT_SUBJECTS.filter(s => !formData.subjects.includes(s)).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSubject(s)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Additional Notes</label>
                <textarea
                  placeholder="Special requirements, student background, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-blue hover:bg-blue-800 rounded-xl shadow-sm transition-colors"
                >
                  {editingJob ? 'Save Changes' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
