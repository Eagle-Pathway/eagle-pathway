'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ClipboardList,
  MapPin,
  Clock,
  DollarSign,
  Send,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/date';

interface TutorJob {
  id: string;
  student_id: string;
  subject: string;
  grade_level?: string;
  location?: string;
  schedule_details?: string;
  budget_range?: string;
  description?: string;
  status: string;
  created_at: string;
}

export default function TutorJobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<TutorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [proposalNotes, setProposalNotes] = useState('');
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const { data, error } = await supabase
          .from('tutor_job_posts')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setJobs((data as any) || []);
      } catch (err) {
        console.warn('Fetch tutor jobs error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  const handleApplyProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJobId || !user) return;

    setApplyLoading(true);
    try {
      const { error } = await supabase.from('tutor_job_applications').insert({
        job_id: applyingJobId,
        tutor_user_id: user.id,
        notes: proposalNotes.trim() || 'I am interested in taking on this tutoring request.',
        status: 'pending',
      });

      if (error) throw error;
      setApplySuccess('Your tutoring proposal has been submitted to the student!');
      setApplyingJobId(null);
      setProposalNotes('');
      setTimeout(() => setApplySuccess(null), 4000);
    } catch (err: any) {
      console.warn('Apply proposal error:', err);
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
            Tutor Job Opportunities
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse open 1-on-1 student tutoring requests and submit teaching proposals.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <ClipboardList size={16} />
          <span>{jobs.length} Open Requests</span>
        </div>
      </div>

      {applySuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in duration-150">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{applySuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B2A5B]/20 border-t-[#0B2A5B] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading open tutoring requests...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <ClipboardList size={40} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Open Student Requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            New tutoring job posts are published here as students submit requests. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {job.grade_level || 'Grade 11/12'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {job.created_at ? formatDate(new Date(job.created_at), 'MMM d') : 'Recent'}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    {job.subject || 'STEM Tutoring'}
                  </h3>
                  {job.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                  )}
                </div>

                {job.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {job.description}
                  </p>
                )}

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-1">
                  {job.schedule_details && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>{job.schedule_details}</span>
                    </div>
                  )}
                  {job.budget_range && (
                    <div className="flex items-center gap-1.5 font-bold text-[#0B2A5B]">
                      <DollarSign size={13} className="text-[#C9A84C]" />
                      <span>Budget: {job.budget_range} ETB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => setApplyingJobId(job.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Send size={14} className="text-[#C9A84C]" />
                  <span>Submit Teaching Proposal</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Proposal Modal */}
      {applyingJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-[#0B2A5B]">Submit Proposal to Student</h3>
            <p className="text-xs text-slate-500">
              Introduce yourself, highlight your teaching experience, and proposed schedule.
            </p>

            <form onSubmit={handleApplyProposal} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cover Note &amp; Experience
                </label>
                <textarea
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  placeholder="I have 3+ years teaching SAT Math and can meet on Tuesdays &amp; Thursdays..."
                  rows={4}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyingJobId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  {applyLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                  <span>Send Proposal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
