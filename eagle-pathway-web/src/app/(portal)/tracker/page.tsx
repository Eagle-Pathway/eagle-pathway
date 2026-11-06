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

const COLUMNS = [
  { id: 'draft', title: 'Draft / In Progress', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
  { id: 'submitted', title: 'Submitted', color: 'bg-blue-50 text-blue-700', border: 'border-blue-300' },
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
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    async function fetchApplications() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*, scholarship:scholarships(*)')
          .eq('student_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setApplications((data as any) || []);
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
    if (!user || !newTitle.trim()) return;

    setModalLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          student_id: user.id,
          status: newStatus,
          notes: newNotes.trim() || newTitle.trim(),
          applied_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setApplications([data as any, ...applications]);
      setShowModal(false);
      setNewTitle('');
      setNewNotes('');
    } catch (err) {
      console.warn('Create application error:', err);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
            Applications Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your university admissions, scholarship dossiers, and decision statuses in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-[#0B2A5B] text-white shadow-sm' : 'text-slate-500'
                }`}
              title="Kanban Board"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-[#0B2A5B] text-white shadow-sm' : 'text-slate-500'
                }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus size={16} />
            <span>Track New Application</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B2A5B]/20 border-t-[#0B2A5B] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
          <Briefcase size={40} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Applications Tracked Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Discover scholarships in our hub or track an external university application to keep deadlines organized.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/scholarships"
              className="px-4 py-2 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold"
            >
              Browse Scholarships
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Track Custom Application
            </button>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {COLUMNS.map((col) => {
            const colApps = applications.filter((a) => {
              const s = (a.status || 'draft').toLowerCase();
              return s === col.id;
            });

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/60 space-y-3 min-h-[450px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-extrabold text-slate-500">{colApps.length}</span>
                </div>

                <div className="space-y-3">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow transition-all space-y-3"
                    >
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        {app.scholarship?.name || (app.scholarship as any)?.title || app.notes || 'University Application'}
                      </h4>

                      {(app.scholarship?.organization || (app.scholarship as any)?.host_institution) && (
                        <p className="text-xs text-slate-500 font-medium">
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
                          className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Opportunity / Program</th>
                  <th className="py-3.5 px-6">Host University</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Date Added</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {app.scholarship?.name || (app.scholarship as any)?.title || app.notes || 'University Application'}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {app.scholarship?.organization || (app.scholarship as any)?.host_institution || 'Direct Admission'}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={app.status || 'draft'}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value)
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700"
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="interview">Under Review</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {app.created_at ? formatDate(new Date(app.created_at), 'MMM d, yyyy') : 'Recently'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {app.scholarship_id && (
                        <Link
                          href={`/scholarships/${app.scholarship_id}`}
                          className="font-bold text-[#0B2A5B] hover:underline"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-[#0B2A5B]">Track New Application</h3>
            <p className="text-xs text-slate-500">
              Track a scholarship, university admission, or study visa process.
            </p>

            <form onSubmit={handleCreateApplication} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Program or University Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Oxford Rhodes Scholarship or Harvard Admissions"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="draft">Draft / Preparing Documents</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="accepted">Accepted</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes &amp; Deadlines (Optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Need 2 recommendation letters, submit before Nov 15th..."
                  rows={3}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-bold shadow-sm"
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
