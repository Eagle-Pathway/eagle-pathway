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
import { TutorJobSkeleton } from '@/components/ui/Skeletons';
import { getErrorMessage } from '@/utils/errorHandler';

interface TutorJob {
  id: string;
  student_id: string;
  subject?: string;
  subjects?: string[];
  grade?: string;
  grade_level?: string;
  place?: string;
  location?: string;
  schedule_details?: string;
  budget_range?: string;
  hourly_rate?: number;
  description?: string;
  notes?: string;
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
  const [applyError, setApplyError] = useState<string | null>(null);
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
    setApplyError(null);
    setApplySuccess(null);

    try {
      const payload = {
        job_post_id: applyingJobId,
        applicant_id: user.id,
        notes: proposalNotes.trim() || 'I am interested in taking on this tutoring request.',
        status: 'pending',
      };

      const { error } = await supabase.from('tutor_job_applications').insert(payload);
      if (error) {
        // Fallback retry for legacy database instances
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          const { error: fallbackErr } = await supabase.from('tutor_job_applications').insert({
            job_id: applyingJobId,
            tutor_user_id: user.id,
            notes: proposalNotes.trim() || 'I am interested in taking on this tutoring request.',
            status: 'pending',
          });
          if (fallbackErr) throw fallbackErr;
        } else {
          throw error;
        }
      }

      setApplySuccess('Your tutoring proposal has been submitted to the student!');
      setApplyingJobId(null);
      setProposalNotes('');
      setTimeout(() => setApplySuccess(null), 4000);
    } catch (err: any) {
      console.warn('Apply proposal error:', err);
      setApplyError(getErrorMessage(err, 'Failed to submit proposal. Please try again.'));
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <ClipboardList size={14} />
            <span>Marketplace Dispatch</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tutor Job Opportunities
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse open 1-on-1 student tutoring requests and submit teaching proposals.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-50 text-brand-blue text-[11px] font-semibold border border-blue-200/60 self-start sm:self-auto">
          <ClipboardList size={14} />
          <span>{jobs.length} Open Requests</span>
        </div>
      </div>

      {applySuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{applySuccess}</span>
        </div>
      )}

      {loading ? (
        <TutorJobSkeleton />
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/80 p-8 space-y-3 shadow-xs">
          <ClipboardList size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Open Student Requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            New tutoring job posts are published here as students submit requests. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const subjectLabel = job.subject || (Array.isArray(job.subjects) ? job.subjects.join(', ') : 'STEM Tutoring');
            const placeLabel = job.location || job.place || 'Addis Ababa';
            const rateLabel = job.hourly_rate || job.budget_range;

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                      {job.grade_level || job.grade || 'Grade 11/12'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {job.created_at ? formatDate(job.created_at, 'MMM d') : 'Recent'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                      {subjectLabel}
                    </h3>
                    {placeLabel && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{placeLabel}</span>
                      </div>
                    )}
                  </div>

                  {(job.description || job.notes) && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {job.description || job.notes}
                    </p>
                  )}

                  <div className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-200/60 text-xs text-slate-600 space-y-1">
                    {job.schedule_details && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Clock size={12} className="text-slate-400" />
                        <span>{job.schedule_details}</span>
                      </div>
                    )}
                    {rateLabel && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <span>Rate: {rateLabel} ETB/hr</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setApplyingJobId(job.id)}
                    className="w-full py-2 px-3.5 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Submit Proposal</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Proposal Modal */}
      {applyingJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Submit Proposal to Student</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Introduce yourself, highlight your teaching experience, and proposed schedule.
              </p>
            </div>

            {applyError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            <form onSubmit={handleApplyProposal} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Cover Note &amp; Experience
                </label>
                <textarea
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  placeholder="I have 3+ years teaching SAT Math and can meet on Tuesdays &amp; Thursdays..."
                  rows={4}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyingJobId(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  {applyLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
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
