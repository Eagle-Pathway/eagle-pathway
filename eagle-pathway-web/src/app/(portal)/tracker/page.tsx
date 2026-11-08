'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Application } from '@eagle-pathway/shared';
import {
  Briefcase,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import { TrackerBoardSkeleton } from '@/components/ui/Skeletons';

const COLUMNS = [
  { id: 'draft', title: 'Draft / In Progress', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
  { id: 'submitted', title: 'Submitted', color: 'bg-blue-50 text-brand-blue', border: 'border-blue-300' },
  { id: 'interview', title: 'Under Review / Interview', color: 'bg-amber-50 text-amber-700', border: 'border-amber-300' },
  { id: 'accepted', title: 'Accepted / Enrolled', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-300' },
];

export default function ApplicationsTrackerPage() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<any>('draft');
  const [newDeadline, setNewDeadline] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [scholarshipOptions, setScholarshipOptions] = useState<any[]>([]);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      if (!user?.id) return;
      try {
        const [{ data, error }, { data: sList }] = await Promise.all([
          supabase
            .from('applications')
            .select('*, scholarship:scholarships(*)')
            .eq('student_id', user.id)
            .order('updated_at', { ascending: false }),
          supabase
            .from('scholarships')
            .select('id, name, country')
            .order('name'),
        ]);

        if (error) throw error;
        setApplications((data as any) || []);
        if (sList && sList.length > 0) {
          setScholarshipOptions(sList);
          setSelectedScholarshipId(sList[0].id);
        }
      } catch (err) {
        console.warn('Fetch applications error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [user?.id]);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!user) return;

    const targetScholId = selectedScholarshipId || scholarshipOptions[0]?.id;
    if (!targetScholId) {
      setModalError('No active scholarship program selected.');
      return;
    }

    setModalLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          student_id: user.id,
          scholarship_id: targetScholId,
          package_tier: 'standard',
          status: newStatus,
          sop_content: newNotes.trim() || (newTitle.trim() ? `Notes: ${newTitle.trim()}` : undefined),
        })
        .select('*, scholarship:scholarships(*)')
        .single();

      if (error) throw error;
      setApplications([data as any, ...applications]);
      setShowModal(false);
      setNewTitle('');
      setNewNotes('');
    } catch (err: any) {
      console.warn('Create application error:', err);
      setModalError('Failed to save application to tracker. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, status: any) => {
    try {
      await supabase.from('applications').update({ status }).eq('id', appId);
      setApplications(
        applications.map((a) => (a.id === appId ? { ...a, status } : a))
      );
    } catch (err) {
      console.warn('Status update error:', err);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Briefcase size={14} />
            <span>Admissions Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Applications Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your university admissions, scholarship dossiers, and decision statuses in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban Board"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus size={15} />
            <span>Track Application</span>
          </button>
        </div>
      </div>

      {loading ? (
        <TrackerBoardSkeleton />
      ) : applications.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/80 p-8 space-y-3 shadow-xs">
          <Briefcase size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Applications Tracked Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Discover scholarships in our hub or track an external university application to keep deadlines organized.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              href="/scholarships"
              className="px-3.5 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs"
            >
              Browse Scholarships
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs"
            >
              Track Custom Application
            </button>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colApps = applications.filter((a) => {
              const s = (a.status || 'draft').toLowerCase();
              return s === col.id;
            });

            return (
              <div
                key={col.id}
                className="bg-slate-100/60 rounded-xl p-3.5 border border-slate-200/60 space-y-3 min-h-[420px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{colApps.length}</span>
                </div>

                <div className="space-y-2.5">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-2.5"
                    >
                      <h4 className="font-semibold text-xs text-slate-900 leading-snug">
                        {app.scholarship?.name || (app.scholarship as any)?.title || app.notes || 'University Application'}
                      </h4>

                      {(app.scholarship?.organization || (app.scholarship as any)?.host_institution) && (
                        <p className="text-[11px] text-slate-500">
                          {app.scholarship?.organization || (app.scholarship as any)?.host_institution}
                        </p>
                      )}

                      {/* Status select dropdown */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <select
                          value={app.status || 'draft'}
                          onChange={(e) =>
                            handleStatusChange(app.id, e.target.value)
                          }
                          className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="interview">Under Review</option>
                          <option value="accepted">Accepted</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-5">Opportunity / Program</th>
                  <th className="py-3 px-5">Host University</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Date Added</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {app.scholarship?.name || (app.scholarship as any)?.title || app.notes || 'University Application'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {app.scholarship?.organization || (app.scholarship as any)?.host_institution || 'Direct Admission'}
                    </td>
                    <td className="py-3.5 px-5">
                      <select
                        value={app.status || 'draft'}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value)
                        }
                        className="px-2 py-1 rounded text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700"
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="interview">Under Review</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {app.created_at ? formatDate(app.created_at, 'MMM d, yyyy') : 'Recently'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {app.scholarship_id && (
                        <Link
                          href={`/scholarships/${app.scholarship_id}`}
                          className="font-semibold text-brand-blue hover:underline"
                        >
                          View Details &rarr;
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Track Custom Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Track New Application</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track a scholarship, university admission, or study visa process.
              </p>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateApplication} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Target Scholarship Program
                </label>
                <select
                  value={selectedScholarshipId}
                  onChange={(e) => setSelectedScholarshipId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                >
                  {scholarshipOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.country || 'Global'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Application Title / Custom Track Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Oxford Rhodes Scholarship or Fall 2026 Intake"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Initial Pipeline Stage
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="draft">Draft / Preparing Documents</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review / Interview</option>
                  <option value="accepted">Accepted / Enrolled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Application Notes &amp; Deadlines (Optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Need 2 recommendation letters, submit before Nov 15th..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {modalLoading ? 'Saving...' : 'Add to Tracker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
