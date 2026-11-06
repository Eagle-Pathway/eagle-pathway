'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Scholarship } from '@eagle-pathway/shared';
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  AlertCircle,
  BookmarkCheck,
  Bookmark,
  Share2,
} from 'lucide-react';
import { formatDate, differenceInDays } from '@/lib/date';

export default function ScholarshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const scholarshipId = params?.id as string;

  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!scholarshipId) return;
      try {
        const { data, error } = await supabase
          .from('scholarships')
          .select('*')
          .eq('id', scholarshipId)
          .single();

        if (error) throw error;
        setScholarship(data as any);

        if (user?.id) {
          const [{ data: savedData }, { data: appData }] = await Promise.all([
            supabase
              .from('saved_scholarships')
              .select('id')
              .eq('user_id', user.id)
              .eq('scholarship_id', scholarshipId)
              .maybeSingle(),
            supabase
              .from('applications')
              .select('id')
              .eq('student_id', user.id)
              .eq('scholarship_id', scholarshipId)
              .maybeSingle(),
          ]);

          setIsSaved(!!savedData);
          setHasApplied(!!appData);
        }
      } catch (err) {
        console.warn('Load scholarship error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [scholarshipId, user?.id]);

  const handleToggleSave = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (isSaved) {
      await supabase
        .from('saved_scholarships')
        .delete()
        .eq('user_id', user.id)
        .eq('scholarship_id', scholarshipId);
      setIsSaved(false);
    } else {
      await supabase
        .from('saved_scholarships')
        .insert({ user_id: user.id, scholarship_id: scholarshipId });
      setIsSaved(true);
      setActionSuccess('Scholarship bookmarked to your saved list!');
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  const handleAddToTracker = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (hasApplied) return;

    try {
      const { error } = await supabase.from('applications').insert({
        student_id: user.id,
        scholarship_id: scholarshipId,
        status: 'draft',
        applied_date: new Date().toISOString(),
        notes: `Application for ${scholarship?.name || (scholarship as any)?.title}`,
      });
      if (error) throw error;
      setHasApplied(true);
      setActionSuccess('Added to your Applications Tracker! Track your progress from the Applications tab.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.warn('Add application error:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#0B2A5B]/20 border-t-[#0B2A5B] rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Loading scholarship details...</p>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900">Scholarship Not Found</h2>
        <p className="text-xs text-slate-500">The scholarship you requested may have expired or was removed.</p>
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold"
        >
          <ArrowLeft size={14} />
          <span>Back to Scholarships Hub</span>
        </Link>
      </div>
    );
  }

  const daysLeft = scholarship.deadline
    ? differenceInDays(new Date(scholarship.deadline), new Date())
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Back button */}
      <Link
        href="/scholarships"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0B2A5B] transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to All Scholarships</span>
      </Link>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in duration-150">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {scholarship.funding_type || 'Fully Funded'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                {scholarship.degree_levels?.[0] || (scholarship as any).degree_level || 'All Degree Levels'}
              </span>
              {scholarship.country && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  📍 {scholarship.country}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight leading-tight">
              {scholarship.name || (scholarship as any).title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <MapPin size={16} className="text-slate-400" />
              <span>{scholarship.organization || (scholarship as any).host_institution || scholarship.country || 'Global Host'}</span>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSave}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold ${isSaved
                ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#0B2A5B]'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
            >
              {isSaved ? <BookmarkCheck size={18} className="text-[#C9A84C]" /> : <Bookmark size={18} />}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Deadline alert banner */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Application Deadline:{' '}
                {scholarship.deadline
                  ? formatDate(new Date(scholarship.deadline), 'MMMM d, yyyy')
                  : 'Open Rolling Admissions'}
              </p>
              {daysLeft !== null && (
                <p className="text-[11px] text-amber-700 font-medium">
                  {daysLeft > 0 ? `${daysLeft} calendar days remaining to apply` : 'Applications closing very soon'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToTracker}
              disabled={hasApplied}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${hasApplied
                ? 'bg-emerald-100 text-emerald-800 cursor-default'
                : 'bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white shadow-sm'
                }`}
            >
              {hasApplied ? 'In Application Tracker ✓' : '+ Add to Tracker'}
            </button>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Program Overview</h2>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {scholarship.description ||
              'This international scholarship program provides comprehensive tuition coverage and academic support for qualifying undergraduate and graduate scholars.'}
          </div>
        </div>

        {/* Eligibility & Requirements */}
        {scholarship.requirements && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Eligibility &amp; Criteria</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
              {scholarship.requirements}
            </div>
          </div>
        )}

        {/* External Link Action */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Official instructions, application portals, and university submission guidelines.
          </p>
          {scholarship.application_url ? (
            <a
              href={scholarship.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] font-extrabold text-xs shadow-md hover:brightness-105 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
            >
              <span>Visit Official Application Portal</span>
              <ExternalLink size={15} />
            </a>
          ) : (
            <button
              onClick={handleAddToTracker}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0B2A5B] text-white font-extrabold text-xs shadow-md hover:bg-[#1E4D9B]"
            >
              <span>Start Application in Tracker</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
