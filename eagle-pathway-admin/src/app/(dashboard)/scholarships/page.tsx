'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Edit2, Trash2, ExternalLink, Search, Download, CheckCircle2,
  AlertCircle, ShieldCheck, Inbox, Sparkles, Filter, XCircle, Eye
} from 'lucide-react';
import ScholarshipForm from '@/components/forms/ScholarshipForm';
import { exportToCSV } from '@/utils/export';
import { useConfirm, useToast } from '@/components/ui/Feedback';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

interface Scholarship {
  id: string;
  name: string;
  organization: string;
  funding_details: string;
  funding_type?: string;
  deadline: string;
  country: string;
  host_country?: string;
  country_flag: string;
  degree_levels: string[];
  is_active: boolean;
  source_status?: 'verified' | 'unverified' | 'stale' | 'broken';
  verification_status?: 'verified' | 'under_review' | 'draft' | 'needs_info' | 'rejected';
  verified_at?: string | null;
  stale_reason?: string | null;
  confidence_score?: number;
  submitted_by_email?: string | null;
  submission_notes?: string | null;
  website_url?: string;
  application_url?: string;
  created_at?: string;
}

type FilterTab = 'all' | 'verified' | 'community_pending' | 'needs_review';

export default function ScholarshipsPage() {
  const confirm = useConfirm();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const toast = useToast();

  async function fetchScholarships() {
    setLoading(true);
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setScholarships(data as Scholarship[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchScholarships();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete scholarship?',
      message: 'This permanently removes the scholarship from the database. This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('scholarships').delete().eq('id', id);
    if (error) {
      toast('error', error.message || 'Failed to delete scholarship.');
      return;
    }
    toast('success', 'Scholarship deleted.');
    fetchScholarships();
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('scholarships')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    if (error) {
      toast('error', error.message || 'Failed to update scholarship status.');
      return;
    }
    toast('success', `Scholarship marked as ${!currentStatus ? 'active' : 'inactive'}.`);
    fetchScholarships();
  };

  const approveSubmission = async (scholarship: Scholarship) => {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('scholarships')
      .update({
        is_active: true,
        verification_status: 'verified',
        source_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: auth.user?.id || null,
        last_verified_at: new Date().toISOString(),
        confidence_score: 100,
        deadline_verified: true,
        eligibility_verified: true,
        application_link_verified: true,
      })
      .eq('id', scholarship.id);

    if (error) {
      toast('error', error.message || 'Failed to approve scholarship.');
      return;
    }
    toast('success', `"${scholarship.name}" approved & published live! 🚀`);
    fetchScholarships();
  };

  const rejectSubmission = async (scholarship: Scholarship) => {
    const ok = await confirm({
      title: 'Reject Community Submission?',
      message: `Are you sure you want to reject "${scholarship.name}"? It will remain inactive.`,
      confirmLabel: 'Reject',
      destructive: true,
    });
    if (!ok) return;

    const { error } = await supabase
      .from('scholarships')
      .update({
        is_active: false,
        verification_status: 'rejected',
        source_status: 'broken',
      })
      .eq('id', scholarship.id);

    if (error) {
      toast('error', error.message || 'Failed to reject submission.');
      return;
    }
    toast('info', `Submission marked as rejected.`);
    fetchScholarships();
  };

  const updateSourceStatus = async (
    id: string,
    sourceStatus: NonNullable<Scholarship['source_status']>,
  ) => {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('scholarships')
      .update({
        source_status: sourceStatus,
        verified_at: sourceStatus === 'verified' ? new Date().toISOString() : null,
        verified_by: sourceStatus === 'verified' ? auth.user?.id || null : null,
        stale_reason: sourceStatus === 'verified' ? null : sourceStatus,
        verification_status: sourceStatus === 'verified' ? 'verified' : undefined,
      })
      .eq('id', id);
    if (error) {
      toast('error', error.message || 'Failed to update verification status.');
      return;
    }
    toast('success', 'Verification status updated.');
    fetchScholarships();
  };

  // Counts for tabs
  const pendingCount = scholarships.filter(
    s => s.verification_status === 'under_review' || (s.source_status === 'unverified' && !s.is_active)
  ).length;

  const verifiedCount = scholarships.filter(
    s => s.verification_status === 'verified' && s.is_active
  ).length;

  const needsReviewCount = scholarships.filter(
    s => s.source_status === 'stale' || s.source_status === 'broken' || s.verification_status === 'needs_info'
  ).length;

  // Filtered dataset
  const filtered = scholarships.filter(s => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.organization || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.country || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.submitted_by_email || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'verified') {
      return s.verification_status === 'verified' && s.is_active;
    }
    if (activeTab === 'community_pending') {
      return s.verification_status === 'under_review' || (s.source_status === 'unverified' && !s.is_active);
    }
    if (activeTab === 'needs_review') {
      return s.source_status === 'stale' || s.source_status === 'broken' || s.verification_status === 'needs_info';
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Scholarship Intelligence
            <span className="text-xs px-2.5 py-1 rounded-full bg-brand-blue/10 text-brand-blue font-bold tracking-wide">
              {scholarships.length} Total
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Audit, verify, and moderate scholarship opportunities & community submissions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingScholarship(null);
            setIsFormOpen(true);
          }}
          className="flex items-center px-4 py-2.5 bg-brand-blue text-white rounded-xl shadow-md hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Scholarship
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>All Scholarships</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {scholarships.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'verified'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified & Live</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'verified' ? 'bg-white/20' : 'bg-green-100 text-green-800'}`}>
            {verifiedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('community_pending')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'community_pending'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>📥 Community Submissions</span>
          {pendingCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse ${
              activeTab === 'community_pending' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-900'
            }`}>
              {pendingCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('needs_review')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'needs_review'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>⚠️ Needs Audit / Broken</span>
          {needsReviewCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'needs_review' ? 'bg-white/20' : 'bg-red-100 text-red-800'}`}>
              {needsReviewCount}
            </span>
          )}
        </button>
      </div>

      {isFormOpen && (
        <ScholarshipForm
          scholarship={editingScholarship}
          onClose={() => {
            setIsFormOpen(false);
            setEditingScholarship(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingScholarship(null);
            fetchScholarships();
          }}
        />
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title, provider, destination, or submitter email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue bg-white"
            />
          </div>

          <button
            onClick={() => exportToCSV(filtered, 'scholarships_export')}
            className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2 text-gray-500" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider & Benefits</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target & Deadline</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moderation Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source / Provenance</th>
                <th scope="col" className="relative px-6 py-3 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton cols={6} rows={5} avatarCol={false} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="font-semibold text-gray-700">No scholarships found in this filter.</p>
                      <p className="text-xs text-gray-400 mt-1">Try switching tabs or adjusting your search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((scholarship) => {
                  const isCommunityPending = scholarship.verification_status === 'under_review' || (scholarship.source_status === 'unverified' && !scholarship.is_active);

                  return (
                    <tr
                      key={scholarship.id}
                      className={`hover:bg-gray-50/50 transition-colors ${
                        isCommunityPending ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Column 1: Opportunity */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{scholarship.country_flag || '🌍'}</span>
                          <div>
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                              <span>{scholarship.name}</span>
                              {isCommunityPending && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  📥 Audience Submission
                                </span>
                              )}
                              {scholarship.verification_status === 'verified' && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] text-green-700 font-semibold" title="Verified by Eagle Pathway">
                                  <ShieldCheck className="w-3.5 h-3.5 text-green-600 inline" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {scholarship.host_country || scholarship.country}
                            </div>
                            {scholarship.website_url && (
                              <a
                                href={scholarship.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-brand-blue hover:underline mt-1"
                              >
                                <span>Official Website</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Provider & Benefits */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{scholarship.organization}</div>
                        <div className="text-xs text-brand-gold font-semibold mt-1">
                          {scholarship.funding_details}
                        </div>
                      </td>

                      {/* Column 3: Target & Deadline */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {scholarship.degree_levels?.map(level => (
                            <div key={level} className="text-[10px] uppercase font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                              {level}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">
                          Due: <span className="font-semibold text-gray-700">{scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString() : 'Rolling'}</span>
                        </div>
                      </td>

                      {/* Column 4: Moderation Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <button
                            onClick={() => toggleStatus(scholarship.id, scholarship.is_active)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize cursor-pointer transition-colors ${
                              scholarship.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {scholarship.is_active ? '● Live' : '○ Inactive'}
                          </button>

                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              scholarship.verification_status === 'verified'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : scholarship.verification_status === 'under_review'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-gray-50 text-gray-600 border border-gray-200'
                            }`}>
                              {scholarship.verification_status || 'unverified'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Source / Provenance */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {scholarship.submitted_by_email ? (
                            <div className="text-xs text-gray-600">
                              <span className="text-[10px] text-gray-400 block font-bold uppercase">Submitted By:</span>
                              <span className="font-medium text-gray-800">{scholarship.submitted_by_email}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Admin Curated</span>
                          )}

                          {scholarship.submission_notes && (
                            <p className="text-[11px] text-gray-500 italic line-clamp-1" title={scholarship.submission_notes}>
                              "{scholarship.submission_notes}"
                            </p>
                          )}

                          <select
                            value={scholarship.source_status || 'unverified'}
                            onChange={(e) => updateSourceStatus(scholarship.id, e.target.value as NonNullable<Scholarship['source_status']>)}
                            className="max-w-[130px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                          >
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                            <option value="stale">Stale</option>
                            <option value="broken">Broken</option>
                          </select>
                        </div>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* If Community Submission, provide 1-Click Approve or Audit */}
                          {isCommunityPending ? (
                            <>
                              <button
                                onClick={() => approveSubmission(scholarship)}
                                className="px-2.5 py-1 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-2xs flex items-center gap-1"
                                title="Approve and publish live"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setEditingScholarship(scholarship);
                                  setIsFormOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-brand-blue hover:bg-blue-800 text-white rounded-lg shadow-2xs flex items-center gap-1"
                                title="Review and enrich before publishing"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Review
                              </button>
                              <button
                                onClick={() => rejectSubmission(scholarship)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Reject submission"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const session = await supabase.auth.getSession();
                                    const token = session.data.session?.access_token;
                                    const res = await fetch('/api/broadcast', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({
                                        title: `Scholarship Opportunity 🎓: ${scholarship.name}`,
                                        body: `${scholarship.organization} (${scholarship.country}) — ${scholarship.funding_details}. Deadline: ${new Date(scholarship.deadline).toLocaleDateString()}. Tap to view details & apply!`,
                                        audience: 'student',
                                        type: 'application_update',
                                      }),
                                    });
                                    if (res.ok) {
                                      toast('success', `Broadcast alert sent to matching candidates! 🚀`);
                                    } else {
                                      toast('error', 'Failed to broadcast scholarship alert.');
                                    }
                                  } catch {
                                    toast('error', 'Network error broadcasting scholarship alert.');
                                  }
                                }}
                                className="px-2 py-1 text-xs font-semibold bg-brand-blue text-white rounded-md hover:bg-blue-700 shadow-2xs"
                                title="Broadcast scholarship alert to candidates"
                              >
                                📢 Alert
                              </button>
                              <button
                                onClick={() => {
                                  setEditingScholarship(scholarship);
                                  setIsFormOpen(true);
                                }}
                                className="text-gray-400 hover:text-brand-blue transition-colors p-1"
                                title="Edit scholarship"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(scholarship.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Delete scholarship"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
