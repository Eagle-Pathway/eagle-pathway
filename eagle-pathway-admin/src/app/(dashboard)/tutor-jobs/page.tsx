'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Eye, XCircle, Clock, MapPin, BookOpen, Users, DollarSign, Bell } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useToast } from '@/components/ui/Feedback';

interface JobPost {
  id: string;
  created_at: string;
  place: string;
  grade: string;
  subjects: string[];
  session_hours: number;
  days_per_week: number;
  start_time: string;
  hourly_rate: number;
  gender_preference: string;
  status: string;
  posted_by: string;
}

interface JobApplication {
  id: string;
  job_post_id: string;
  applicant_id: string;
  status: string;
  education_status?: string;
  living_address?: string;
  university_name?: string;
  phone_number?: string;
  telegram_username?: string;
  cgpa?: string;
  created_at: string;
  applicant?: {
    full_name: string;
    phone: string;
    email: string;
  };
}

const SUBJECTS_LIST = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Amharic',
  'History', 'Geography', 'Civics', 'Economics', 'Business', 'ICT/Computer',
  'SAT', 'IELTS', 'TOEFL', 'French', 'Arabic', 'Chinese',
  'Music', 'Art', 'Physical Education', 'Other',
];

function formatTimeToPostgres(input: string): string {
  if (!input) return '09:00:00';
  let cleaned = input.trim().replace(/(LT|EAT)/gi, '').trim();

  const pmMatch = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (pmMatch) {
    let hours = parseInt(pmMatch[1], 10);
    const minutes = pmMatch[2] || '00';
    const period = pmMatch[3].toLowerCase();
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  }

  const timeMatch = cleaned.match(/(\d{1,2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10) % 24;
    const minutes = timeMatch[2] || '00';
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  }

  return '09:00:00';
}

export default function TutorJobsPage() {
  const showToast = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [newJob, setNewJob] = useState({
    place: '',
    grade: '',
    subjects: [] as string[],
    session_hours: '',
    days_per_week: '',
    start_time: '',
    hourly_rate: '',
    gender_preference: 'both',
  });
  const [saving, setSaving] = useState(false);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tutor_job_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setJobs(data as JobPost[]);
    setLoading(false);
  }

  useEffect(() => { fetchJobs(); }, []);

  async function fetchApplicants(jobId: string) {
    setLoadingApplicants(true);
    const { data, error } = await supabase
      .from('tutor_job_applications')
      .select('*, applicant:users(full_name, phone, email)')
      .eq('job_post_id', jobId)
      .order('created_at', { ascending: false });
    if (!error && data) setApplicants(data as unknown as JobApplication[]);
    setLoadingApplicants(false);
  }

  async function handleCreateJob() {
    if (!newJob.place || !newJob.grade || !newJob.subjects.length || !newJob.session_hours || !newJob.days_per_week || !newJob.start_time || !newJob.hourly_rate) {
      showToast('error', 'Fill all required fields');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const formattedStartTime = formatTimeToPostgres(newJob.start_time);
    const { data: createdJob, error } = await supabase
      .from('tutor_job_posts')
      .insert({
        posted_by: user?.id,
        place: newJob.place,
        grade: newJob.grade,
        subjects: newJob.subjects,
        session_hours: parseFloat(newJob.session_hours),
        days_per_week: parseInt(newJob.days_per_week, 10),
        start_time: formattedStartTime,
        hourly_rate: parseFloat(newJob.hourly_rate),
        gender_preference: newJob.gender_preference,
        status: 'open',
      })
      .select('id')
      .single();

    if (error) {
      showToast('error', 'Failed to create job: ' + error.message);
    } else {
      showToast('success', 'Job posted successfully!');
      setShowNewModal(false);
      setNewJob({ place: '', grade: '', subjects: [], session_hours: '', days_per_week: '', start_time: '', hourly_rate: '', gender_preference: 'both' });
      fetchJobs();

      // Trigger push notifications to approved tutors (background, non-blocking)
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const targetJobId = createdJob?.id;

      if (token && targetJobId) {
        fetch('/api/notify-new-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ job_post_id: targetJobId }),
        }).catch(e => console.error('Push notification failed:', e));
      }
    }
    setSaving(false);
  }

  async function handleCloseJob(jobId: string) {
    const { error } = await supabase
      .from('tutor_job_posts')
      .update({ status: 'closed' })
      .eq('id', jobId);
    if (error) showToast('error', 'Failed to close job');
    else { showToast('success', 'Job closed'); fetchJobs(); }
  }

  async function handleApplicationStatus(appId: string, status: string) {
    const { error } = await supabase
      .from('tutor_job_applications')
      .update({ status })
      .eq('id', appId);
    if (error) showToast('error', 'Failed to update status');
    else { showToast('success', `Applicant ${status}`); if (selectedJob) fetchApplicants(selectedJob.id); }
  }

  function toggleSubject(subject: string) {
    setNewJob(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  }

  const filtered = jobs.filter(j =>
    j.place?.toLowerCase().includes(search.toLowerCase()) ||
    j.grade?.toLowerCase().includes(search.toLowerCase()) ||
    j.subjects?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const statusBadge = (status: string) => {
    if (status === 'open') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">Open</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Closed</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tutor Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">Post and manage tutor job openings</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center px-4 py-2.5 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Post New Job
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by place, grade, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton cols={6} rows={5} avatarCol={false} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">No tutor jobs posted yet.</td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{job.place}</div>
                      <div className="text-xs text-gray-500">{job.grade} &middot; {job.gender_preference}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                      {job.subjects?.join(', ')}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-brand-gold whitespace-nowrap">{job.hourly_rate} ETB/hr</td>
                    <td className="px-4 py-4 whitespace-nowrap">{statusBadge(job.status)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedJob(job); fetchApplicants(job.id); }}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-brand-blue bg-brand-blue/5 border border-brand-blue/20 rounded-lg hover:bg-brand-blue/10"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Applicants
                        </button>
                        {job.status === 'open' && (
                          <button
                            onClick={() => handleCloseJob(job.id)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Job Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Post New Tutor Job</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place *</label>
                  <input
                    type="text"
                    value={newJob.place}
                    onChange={e => setNewJob({ ...newJob, place: e.target.value })}
                    placeholder="e.g. Bole, Addis Ababa"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                  <input
                    type="text"
                    value={newJob.grade}
                    onChange={e => setNewJob({ ...newJob, grade: e.target.value })}
                    placeholder="e.g. Grade 5, KG, Grade 9-12"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects *</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS_LIST.map(subject => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        newJob.subjects.includes(subject)
                          ? 'bg-brand-blue text-white border-brand-blue'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session (hrs/day) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newJob.session_hours}
                    onChange={e => setNewJob({ ...newJob, session_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days/week *</label>
                  <input
                    type="number"
                    value={newJob.days_per_week}
                    onChange={e => setNewJob({ ...newJob, days_per_week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="text"
                    value={newJob.start_time}
                    onChange={e => setNewJob({ ...newJob, start_time: e.target.value })}
                    placeholder="e.g. 11:35 LT"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (ETB) *</label>
                  <input
                    type="number"
                    value={newJob.hourly_rate}
                    onChange={e => setNewJob({ ...newJob, hourly_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender Preference</label>
                <div className="flex gap-3">
                  {[
                    { value: 'male', label: 'Male Only' },
                    { value: 'female', label: 'Female Only' },
                    { value: 'both', label: 'Both Can Apply' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNewJob({ ...newJob, gender_preference: opt.value })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        newJob.gender_preference === opt.value
                          ? 'bg-brand-blue text-white border-brand-blue'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJob}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-brand-blue/90 disabled:opacity-50"
              >
                {saving ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Applicants Panel */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Applicants for {selectedJob.place}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedJob.grade} — {selectedJob.subjects?.join(', ')}</p>
              </div>
              <button
                onClick={() => { setSelectedJob(null); setApplicants([]); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {loadingApplicants ? (
                <div className="text-center py-10 text-sm text-gray-500">Loading applicants...</div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">No applicants yet.</div>
              ) : (
                <div className="space-y-4">
                  {applicants.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{app.applicant?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{app.applicant?.phone}</p>
                          {app.university_name && <p className="text-sm text-gray-500 mt-1">{app.university_name}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            app.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                            app.status === 'contacted' ? 'bg-blue-50 text-blue-700' :
                            app.status === 'hired' ? 'bg-green-50 text-green-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleApplicationStatus(app.id, 'contacted')}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200"
                        >
                          Mark Contacted
                        </button>
                        <button
                          onClick={() => handleApplicationStatus(app.id, 'hired')}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200"
                        >
                          Hire
                        </button>
                        <button
                          onClick={() => handleApplicationStatus(app.id, 'rejected')}
                          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            const text = `We have Assigned A Teacher/Tutors With The Details Below:\n\n👉Name: ${app.applicant?.full_name || 'Tutor'}\n👉Experience: Experienced Tutor (${app.university_name || 'Qualified'})\n👉Phone: ${app.applicant?.phone || app.phone_number || 'N/A'}\n\nContact Us for Any inquiries\nEagle Tutors\n+251932508910`;
                            navigator.clipboard.writeText(text);
                            showToast('success', 'Parent SMS text copied to clipboard!');
                          }}
                          className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200"
                        >
                          📋 Copy Parent SMS
                        </button>
                        <button
                          onClick={async () => {
                            const newCommStatus = app.status === 'commission_paid' ? 'hired' : 'commission_paid';
                            await handleApplicationStatus(app.id, newCommStatus);
                            showToast('success', newCommStatus === 'commission_paid' ? '50% Commission marked as PAID!' : 'Commission marked as UNPAID');
                          }}
                          className={`px-3 py-1 text-xs font-medium rounded-lg border ${
                            app.status === 'commission_paid'
                              ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
                              : 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {app.status === 'commission_paid' ? '💸 50% Commission: PAID' : '⏳ Mark 50% Commission Paid'}
                        </button>
                      </div>
                      {app.telegram_username && (
                        <p className="text-xs text-gray-400 mt-2">Telegram: @{app.telegram_username}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
