'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useConfirm, useToast } from '@/components/ui/Feedback';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import CareerFormModal from '@/components/forms/CareerFormModal';
import ApplicationDetailModal from '@/components/careers/ApplicationDetailModal';
import { Career, JobApplication, ApplicationStatus } from '@/types/careers';
import {
  Briefcase,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  FileText,
  UserCheck,
  UserX,
  Award,
  ChevronRight,
  RefreshCw,
  Copy,
} from 'lucide-react';

export default function CareersManagementPage() {
  const confirm = useConfirm();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');

  // Careers state
  const [careers, setCareers] = useState<Career[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [careerSearch, setCareerSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Applications state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [applicationSearch, setApplicationSearch] = useState('');
  const [careerFilter, setCareerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  // Fetch Careers
  const fetchCareers = async () => {
    setLoadingCareers(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/careers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch careers');
      setCareers(data.careers || []);
    } catch (err: any) {
      console.error('Fetch careers error:', err);
      // Fallback: direct Supabase query
      const { data: dbCareers } = await supabase
        .from('careers')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbCareers) setCareers(dbCareers as Career[]);
    } finally {
      setLoadingCareers(false);
    }
  };

  // Fetch Applications
  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const params = new URLSearchParams();
      if (careerFilter !== 'all') params.set('career_id', careerFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (applicationSearch.trim()) params.set('search', applicationSearch.trim());

      const res = await fetch(`/api/admin/careers/applications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch applications');
      setApplications(data.applications || []);
    } catch (err: any) {
      console.error('Fetch applications error:', err);
      // Fallback: direct Supabase query
      const { data: dbApps } = await supabase
        .from('job_applications')
        .select('*, career:careers(id, title, department)')
        .order('created_at', { ascending: false });
      if (dbApps) setApplications(dbApps as JobApplication[]);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    fetchCareers();
    fetchApplications();
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [careerFilter, statusFilter]);

  // Toggle Career Active Status
  const handleToggleActive = async (career: Career) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/admin/careers/${career.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !career.is_active }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');

      setCareers((prev) =>
        prev.map((c) => (c.id === career.id ? { ...c, is_active: !career.is_active } : c))
      );
      toast(
        'success',
        `Role "${career.title}" is now ${!career.is_active ? 'Active' : 'Draft / Inactive'}.`
      );
    } catch (err: any) {
      console.error('Toggle active error:', err);
      toast('error', err.message || 'Failed to update career status.');
    }
  };

  // Delete Career
  const handleDeleteCareer = async (career: Career) => {
    const confirmed = await confirm({
      title: `Delete Job Opening: "${career.title}"?`,
      message:
        'This role will be permanently removed from the careers page. Existing candidate applications will remain safely stored with the role title archived.',
      confirmLabel: 'Delete Opening',
      destructive: true,
    });

    if (!confirmed) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/admin/careers/${career.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete job posting');

      setCareers((prev) => prev.filter((c) => c.id !== career.id));
      toast('success', `Deleted "${career.title}".`);
    } catch (err: any) {
      console.error('Delete career error:', err);
      toast('error', err.message || 'Failed to delete job opening.');
    }
  };

  // Filtered Careers
  const filteredCareers = useMemo(() => {
    return careers.filter((c) => {
      const matchesSearch =
        !careerSearch.trim() ||
        c.title.toLowerCase().includes(careerSearch.toLowerCase()) ||
        c.department.toLowerCase().includes(careerSearch.toLowerCase()) ||
        c.location.toLowerCase().includes(careerSearch.toLowerCase());

      const matchesDept = departmentFilter === 'all' || c.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [careers, careerSearch, departmentFilter]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    careers.forEach((c) => {
      if (c.department) set.add(c.department);
    });
    return Array.from(set);
  }, [careers]);

  // Metrics
  const activeCareersCount = careers.filter((c) => c.is_active).length;
  const totalAppsCount = applications.length;
  const pendingAppsCount = applications.filter((a) => a.status === 'pending').length;
  const interviewingCount = applications.filter((a) => a.status === 'interviewed' || a.status === 'reviewing').length;
  const offeredCount = applications.filter((a) => a.status === 'offered').length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Briefcase size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Careers & Hiring Management
              </h1>
              <p className="text-xs text-slate-500">
                Manage organizational job openings and evaluate candidate applications submitted via the marketing site.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedCareer(null);
              setIsCareerModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
          >
            <Plus size={16} />
            Post New Job
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Active Openings</span>
            <span className="text-xl font-bold text-slate-900">{activeCareersCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Applicants</span>
            <span className="text-xl font-bold text-slate-900">{totalAppsCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Pending Review</span>
            <span className="text-xl font-bold text-slate-900">{pendingAppsCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Award size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Offers Extended</span>
            <span className="text-xl font-bold text-slate-900">{offeredCount}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'jobs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase size={16} />
          Job Openings ({careers.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 py-3 px-5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          Candidate Applications ({applications.length})
          {pendingAppsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white ml-1">
              {pendingAppsCount} new
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: JOB OPENINGS */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={careerSearch}
                onChange={(e) => setCareerSearch(e.target.value)}
                placeholder="Search openings by title, department, or location..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter size={14} className="text-slate-400" />
                <span>Department:</span>
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchCareers}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                title="Refresh Openings"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Careers Table / Cards */}
          {loadingCareers ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filteredCareers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                <Briefcase size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Job Openings Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {careerSearch || departmentFilter !== 'all'
                  ? 'No roles match the selected filter criteria.'
                  : 'Start by creating your first career opening to display on the company website.'}
              </p>
              <button
                onClick={() => {
                  setSelectedCareer(null);
                  setIsCareerModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus size={15} /> Post First Job
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Role Title & Slug</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Location & Type</th>
                      <th className="py-3 px-4">Experience & Comp</th>
                      <th className="py-3 px-4 text-center">Applicants</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCareers.map((career) => (
                      <tr key={career.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{career.title}</span>
                            {career.featured && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Sparkles size={10} className="text-amber-500" />
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            /{career.slug}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                            {career.department}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin size={13} className="text-slate-400" />
                            <span>{career.location}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {career.employment_type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700 block">
                            {career.experience_level}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {career.salary_range || 'Competitive'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
                            <Calendar size={10} className="text-slate-400" />
                            Apply by {career.deadline || 'Rolling'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setCareerFilter(career.id);
                              setActiveTab('applications');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Users size={12} />
                            {career.applications_count || 0}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleActive(career)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                              career.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {career.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                            {career.is_active ? 'Active' : 'Draft'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedCareer(career);
                                setIsCareerModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Role"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteCareer(career)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Role"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CANDIDATE APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={applicationSearch}
                onChange={(e) => setApplicationSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
                placeholder="Search candidates by name, email, or role..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Briefcase size={14} className="text-slate-400" />
                <span>Job:</span>
              </div>
              <select
                value={careerFilter}
                onChange={(e) => setCareerFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 max-w-[200px]"
              >
                <option value="all">All Job Openings</option>
                {careers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter size={14} className="text-slate-400" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              >
                <option value="all">All Stages</option>
                <option value="pending">Pending Review</option>
                <option value="reviewing">Under Review</option>
                <option value="interviewed">Interviewed</option>
                <option value="offered">Offer Extended</option>
                <option value="rejected">Not Selected</option>
              </select>

              <button
                onClick={fetchApplications}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                title="Refresh Candidates"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Applications Table */}
          {loadingApplications ? (
            <TableSkeleton rows={6} cols={7} />
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Users size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Applications Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Candidate submissions from the main website will automatically appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Applied Role</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Artifacts</th>
                      <th className="py-3 px-4 text-center">Pipeline Stage</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block">
                            {app.full_name}
                          </span>
                          <span className="text-[11px] text-slate-500">{app.email}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block">{app.job_title}</span>
                          {app.career?.department && (
                            <span className="text-[10px] text-slate-400">
                              {app.career.department}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <a href={`tel:${app.phone}`} className="hover:underline block">
                            {app.phone}
                          </a>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {app.resume_url ? (
                              <a
                                href={app.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
                                title="Download candidate CV"
                              >
                                <Download size={12} />
                                View / Download CV
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-300 italic">No CV uploaded</span>
                            )}

                            {app.linkedin_url && (
                              <a
                                href={app.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-slate-400 hover:text-sky-600 rounded transition-colors"
                                title="LinkedIn Profile"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              app.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : app.status === 'reviewing'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : app.status === 'interviewed'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : app.status === 'offered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(app.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedApplication(app);
                              setIsAppModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            Review
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CareerFormModal
        isOpen={isCareerModalOpen}
        onClose={() => setIsCareerModalOpen(false)}
        career={selectedCareer}
        onSuccess={() => {
          fetchCareers();
        }}
      />

      <ApplicationDetailModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        application={selectedApplication}
        onUpdate={(updated) => {
          setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setSelectedApplication(updated);
        }}
      />
    </div>
  );
}

