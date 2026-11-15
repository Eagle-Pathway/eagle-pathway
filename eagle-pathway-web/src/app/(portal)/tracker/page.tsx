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
  Sparkles,
  Wand2,
  Award,
  Microscope,
  Mail,
  Send,
  X,
  Check,
  TrendingUp,
} from 'lucide-react';
import { formatDate, differenceInDays } from '@/lib/date';
import { TrackerBoardSkeleton } from '@/components/ui/Skeletons';

const COLUMNS = [
  { id: 'draft', title: 'Draft / In Progress', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
  { id: 'submitted', title: 'Submitted', color: 'bg-blue-50 text-brand-blue', border: 'border-blue-300' },
  { id: 'interview', title: 'Under Review / Interview', color: 'bg-amber-50 text-amber-700', border: 'border-amber-300' },
  { id: 'accepted', title: 'Accepted / Enrolled', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-300' },
];

interface MilestoneItem {
  id: string;
  label: string;
  weight: number;
  hint: string;
  actionUrl?: (appName: string, country?: string, appId?: string) => string;
  actionLabel?: string;
  actionIcon?: any;
}

const MILESTONES: MilestoneItem[] = [
  {
    id: 'sop',
    label: 'Statement of Purpose (SOP) Red-Teamed',
    weight: 20,
    hint: 'Audited by Selection Committee AI with score ≥ 80%',
    actionUrl: (name, country, appId) =>
      `/tools/sop?scholarshipName=${encodeURIComponent(name)}${appId ? `&appId=${encodeURIComponent(appId)}` : ''}`,
    actionLabel: 'Red-Team SOP',
    actionIcon: Award,
  },
  {
    id: 'transcripts',
    label: 'Academic Transcripts & Degree Scanned',
    weight: 15,
    hint: 'Certified copies translated into English with official stamps',
  },
  {
    id: 'recommendations',
    label: '2 Letters of Recommendation (LOR) Brief',
    weight: 15,
    hint: 'Professors contacted with academic briefing packet',
    actionUrl: (name, country) =>
      `/tools/magic-draft?type=recommendation_brief&scholarshipName=${encodeURIComponent(name)}&country=${encodeURIComponent(country || '')}`,
    actionLabel: 'Gen LOR Packet',
    actionIcon: Mail,
  },
  {
    id: 'language',
    label: 'English Proficiency / Exemption Proof',
    weight: 15,
    hint: 'IELTS/TOEFL score report or English-medium institution waiver',
  },
  {
    id: 'study_plan',
    label: 'Study Plan / Research Proposal Outline',
    weight: 15,
    hint: 'Clear methodology and home-country socioeconomic impact',
    actionUrl: (name, country) =>
      `/tools/magic-draft?type=study_plan&scholarshipName=${encodeURIComponent(name)}&country=${encodeURIComponent(country || '')}`,
    actionLabel: 'Draft Plan',
    actionIcon: Microscope,
  },
  {
    id: 'mock_interview',
    label: 'Committee Mock Interview Practice',
    weight: 20,
    hint: 'Simulated 5 committee defense questions with rubric score ≥ 7.5',
    actionUrl: (name) =>
      `/tools/interview?scholarshipName=${encodeURIComponent(name)}`,
    actionLabel: 'Mock Interview',
    actionIcon: Sparkles,
  },
];

export default function ApplicationsTrackerPage() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Milestone State per Application (persisted locally)
  const [milestonesByApp, setMilestonesByApp] = useState<Record<string, string[]>>({});

  // Active Dossier Modal
  const [selectedAppForDossier, setSelectedAppForDossier] = useState<Application | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<any>('draft');
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
        const apps = (data as any) || [];
        setApplications(apps);

        // Load persisted milestone checkmarks from localStorage
        const loadedMilestones: Record<string, string[]> = {};
        for (const app of apps) {
          try {
            const saved = localStorage.getItem(`eagle_app_milestones_${app.id}`);
            if (saved) {
              loadedMilestones[app.id] = JSON.parse(saved);
            } else {
              // Default pre-population based on status
              if (app.status === 'accepted') {
                loadedMilestones[app.id] = MILESTONES.map((m) => m.id);
              } else if (app.status === 'interview') {
                loadedMilestones[app.id] = ['sop', 'transcripts', 'recommendations', 'language'];
              } else if (app.status === 'submitted') {
                loadedMilestones[app.id] = ['sop', 'transcripts', 'recommendations'];
              } else {
                loadedMilestones[app.id] = [];
              }
            }
          } catch {
            loadedMilestones[app.id] = [];
          }
        }
        setMilestonesByApp(loadedMilestones);

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

  const toggleMilestone = (appId: string, milestoneId: string) => {
    setMilestonesByApp((prev) => {
      const current = prev[appId] || [];
      const updated = current.includes(milestoneId)
        ? current.filter((id) => id !== milestoneId)
        : [...current, milestoneId];

      try {
        localStorage.setItem(`eagle_app_milestones_${appId}`, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save milestone to localStorage:', err);
      }

      return { ...prev, [appId]: updated };
    });
  };

  const calculateReadiness = (app: Application): number => {
    const status = (app.status || 'draft').toLowerCase();
    if (status === 'accepted') return 100;

    const completed = milestonesByApp[app.id] || [];
    let score = 0;
    for (const m of MILESTONES) {
      if (completed.includes(m.id)) {
        score += m.weight;
      }
    }

    if (status === 'interview' && score < 80) score = 80;
    if (status === 'submitted' && score < 70) score = 70;

    return Math.min(100, Math.max(0, score));
  };

  const getReadinessTone = (score: number) => {
    if (score >= 75) {
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        strokeColor: 'text-emerald-500',
        fillColor: 'bg-emerald-500',
        label: 'Ready for Submission',
      };
    }
    if (score >= 40) {
      return {
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        strokeColor: 'text-amber-500',
        fillColor: 'bg-amber-500',
        label: 'In Progress',
      };
    }
    return {
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      strokeColor: 'text-rose-500',
      fillColor: 'bg-rose-500',
      label: 'Early Preparation',
    };
  };

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
            <Sparkles size={14} className="text-brand-gold" />
            <span>Autonomous Admissions Pipeline &amp; AI Studio</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Applications Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track admission milestones, audit your document readiness ring, and bridge directly into Eagle AI Studio.
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
            Discover scholarships in our hub or track an external university application to keep deadlines and dossiers organized.
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
                className="bg-slate-100/60 rounded-xl p-3.5 border border-slate-200/60 space-y-3 min-h-[440px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{colApps.length}</span>
                </div>

                <div className="space-y-3">
                  {colApps.map((app) => {
                    const appName =
                      app.scholarship?.name || (app.scholarship as any)?.title || app.notes || 'University Opportunity';
                    const country = app.scholarship?.country || 'International';
                    const readinessScore = calculateReadiness(app);
                    const tone = getReadinessTone(readinessScore);
                    const deadline = app.scholarship?.deadline;
                    const daysRemaining = deadline ? differenceInDays(deadline) : null;

                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all space-y-3 group"
                      >
                        {/* Header & Host Institution */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                              {appName}
                            </h4>
                          </div>

                          {(app.scholarship?.organization || (app.scholarship as any)?.host_institution) && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {app.scholarship?.organization || (app.scholarship as any)?.host_institution}
                            </p>
                          )}
                        </div>

                        {/* Readiness & Deadline Bar */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={() => setSelectedAppForDossier(app)}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${tone.badgeBg} hover:opacity-85 transition-opacity`}
                            title="Click to audit milestones and readiness"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${tone.fillColor}`} />
                            <span>{readinessScore}% Ready</span>
                          </button>

                          {daysRemaining !== null ? (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                daysRemaining <= 7
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                                  : daysRemaining <= 30
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Clock size={10} className="inline mr-1" />
                              {daysRemaining > 0 ? `${daysRemaining}d left` : daysRemaining === 0 ? 'Today!' : 'Closed'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Ongoing</span>
                          )}
                        </div>

                        {/* 1-Click AI Studio Bridge Strip */}
                        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-200/60 space-y-1.5">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span className="inline-flex items-center gap-1">
                              <Sparkles size={11} className="text-brand-gold" />
                              <span>Eagle AI Studio</span>
                            </span>
                            <button
                              onClick={() => setSelectedAppForDossier(app)}
                              className="text-brand-blue hover:underline text-[10px] font-medium"
                            >
                              Dossier &rarr;
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-1 pt-0.5">
                            <Link
                              href={`/tools/magic-draft?scholarshipName=${encodeURIComponent(appName)}&country=${encodeURIComponent(country)}`}
                              className="px-1.5 py-1 rounded bg-white border border-slate-200 hover:border-brand-blue text-[10px] font-medium text-slate-700 text-center hover:text-brand-blue transition-colors truncate"
                              title="Generate SOP, Research Proposal, or Recommendation Packet"
                            >
                              🪄 Draft
                            </Link>
                            <Link
                              href={`/tools/sop?scholarshipName=${encodeURIComponent(appName)}&appId=${encodeURIComponent(app.id)}`}
                              className="px-1.5 py-1 rounded bg-white border border-slate-200 hover:border-brand-blue text-[10px] font-medium text-slate-700 text-center hover:text-brand-blue transition-colors truncate"
                              title="Audit Statement of Purpose with Selection Board AI"
                            >
                              🛡️ Audit
                            </Link>
                            <Link
                              href={`/tools/interview?scholarshipName=${encodeURIComponent(appName)}`}
                              className="px-1.5 py-1 rounded bg-white border border-slate-200 hover:border-brand-blue text-[10px] font-medium text-slate-700 text-center hover:text-brand-blue transition-colors truncate"
                              title="Simulate Scholarship Mock Interview"
                            >
                              🎙️ Mock
                            </Link>
                          </div>
                        </div>

                        {/* Pipeline Stage Select */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">Stage</span>
                          <select
                            value={app.status || 'draft'}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:bg-white"
                          >
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="interview">Under Review</option>
                            <option value="accepted">Accepted</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
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
                  <th className="py-3 px-5">Readiness</th>
                  <th className="py-3 px-5">Pipeline Stage</th>
                  <th className="py-3 px-5">AI Acceleration</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applications.map((app) => {
                  const appName =
                    app.scholarship?.name || (app.scholarship as any)?.title || app.notes || 'University Opportunity';
                  const country = app.scholarship?.country || 'International';
                  const readinessScore = calculateReadiness(app);
                  const tone = getReadinessTone(readinessScore);

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        <div>{appName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {app.created_at ? formatDate(app.created_at, 'MMM d, yyyy') : 'Recent'}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {app.scholarship?.organization || (app.scholarship as any)?.host_institution || 'Direct Admission'}
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => setSelectedAppForDossier(app)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${tone.badgeBg} hover:opacity-85 transition-opacity`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tone.fillColor}`} />
                          <span>{readinessScore}%</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-5">
                        <select
                          value={app.status || 'draft'}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="px-2 py-1 rounded text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700"
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="interview">Under Review</option>
                          <option value="accepted">Accepted</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/tools/magic-draft?scholarshipName=${encodeURIComponent(appName)}&country=${encodeURIComponent(country)}`}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-brand-blue hover:text-white text-[11px] text-slate-700 transition-colors"
                          >
                            Draft
                          </Link>
                          <Link
                            href={`/tools/sop?scholarshipName=${encodeURIComponent(appName)}&appId=${encodeURIComponent(app.id)}`}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-brand-blue hover:text-white text-[11px] text-slate-700 transition-colors"
                          >
                            Audit
                          </Link>
                          <Link
                            href={`/tools/interview?scholarshipName=${encodeURIComponent(appName)}`}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-brand-blue hover:text-white text-[11px] text-slate-700 transition-colors"
                          >
                            Mock
                          </Link>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedAppForDossier(app)}
                          className="font-semibold text-brand-blue hover:underline"
                        >
                          Audit Dossier &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive AI Application Dossier Modal */}
      {selectedAppForDossier && (() => {
        const app = selectedAppForDossier;
        const appName =
          app.scholarship?.name || (app.scholarship as any)?.title || app.notes || 'University Opportunity';
        const country = app.scholarship?.country || 'International';
        const readinessScore = calculateReadiness(app);
        const tone = getReadinessTone(readinessScore);
        const completedMilestoneIds = milestonesByApp[app.id] || [];
        const deadline = app.scholarship?.deadline;
        const daysRemaining = deadline ? differenceInDays(deadline) : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-blue mb-1">
                    <Sparkles size={13} className="text-brand-gold" />
                    <span>Admissions Dossier Audit</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{appName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {app.scholarship?.organization || (app.scholarship as any)?.host_institution || 'Direct Admission'} • {country}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAppForDossier(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5">
                {/* Visual Readiness Gauge Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
                  <div className="space-y-1.5 text-center sm:text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold px-2 py-0.5 rounded bg-brand-gold/10 border border-brand-gold/20 inline-block">
                      Admissions Board Readiness
                    </span>
                    <h4 className="text-xl font-bold">{tone.label}</h4>
                    <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                      Complete all 6 international deliverables to maximize selection board competitiveness before submitting.
                    </p>
                    {daysRemaining !== null && (
                      <div className="text-xs font-semibold text-amber-300 pt-1 flex items-center justify-center sm:justify-start gap-1">
                        <Clock size={13} />
                        <span>Deadline: {formatDate(deadline!)} ({daysRemaining} days remaining)</span>
                      </div>
                    )}
                  </div>

                  {/* SVG Circular Ring */}
                  <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-700"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={tone.strokeColor}
                        strokeDasharray={`${readinessScore}, 100`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-bold tracking-tight">{readinessScore}%</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Gauge</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Milestone Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Application Deliverables ({completedMilestoneIds.length}/{MILESTONES.length} Completed)
                    </h4>
                    <span className="text-[11px] text-slate-400">Click to check off verified items</span>
                  </div>

                  <div className="space-y-2">
                    {MILESTONES.map((m) => {
                      const isDone = completedMilestoneIds.includes(m.id);
                      const ActionIcon = m.actionIcon || ExternalLink;

                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDone
                              ? 'bg-emerald-50/40 border-emerald-200/80'
                              : 'bg-white border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          {/* Checkbox & Details */}
                          <div
                            onClick={() => toggleMilestone(app.id, m.id)}
                            className="flex items-start gap-3 cursor-pointer flex-1"
                          >
                            <div
                              className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white hover:border-slate-400'
                              }`}
                            >
                              {isDone && <Check size={13} strokeWidth={3} />}
                            </div>

                            <div className="space-y-0.5">
                              <div
                                className={`text-xs font-bold leading-snug ${
                                  isDone ? 'text-emerald-950 line-through opacity-85' : 'text-slate-900'
                                }`}
                              >
                                {m.label}
                                <span className="ml-2 text-[10px] font-semibold text-slate-400 font-mono">
                                  (+{m.weight}%)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">{m.hint}</p>
                            </div>
                          </div>

                          {/* 1-Click Action Shortcut */}
                          {m.actionUrl && (
                            <Link
                              href={m.actionUrl(appName, country, app.id)}
                              onClick={() => setSelectedAppForDossier(null)}
                              className="self-end sm:self-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-brand-blue hover:border-brand-blue text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors flex-shrink-0"
                            >
                              <ActionIcon size={12} />
                              <span>{m.actionLabel}</span>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-[11px] text-slate-400">
                  Readiness auto-syncs with your application tracker.
                </span>
                <button
                  onClick={() => setSelectedAppForDossier(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Close Audit
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
