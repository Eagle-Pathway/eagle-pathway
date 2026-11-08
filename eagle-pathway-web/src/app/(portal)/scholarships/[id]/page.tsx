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
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { formatDate, differenceInDays } from '@/lib/date';
import { DetailHeroSkeleton } from '@/components/ui/Skeletons';

export default function ScholarshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const scholarshipId = params?.id as string;

  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [addingToTracker, setAddingToTracker] = useState(false);
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
    if (hasApplied) {
      router.push('/tracker');
      return;
    }

    setAddingToTracker(true);
    try {
      const { error } = await supabase.from('applications').insert({
        student_id: user.id,
        scholarship_id: scholarshipId,
        package_tier: 'standard',
        status: 'draft',
        sop_content: `Targeting ${scholarship?.name || 'International Scholarship'}`,
      });
      if (error) throw error;
      setHasApplied(true);
      router.push('/tracker');
    } catch (err: any) {
      console.warn('Add application error:', err);
      setActionSuccess('Failed to add to tracker. Please check your connection.');
      setTimeout(() => setActionSuccess(null), 3000);
    } finally {
      setAddingToTracker(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <DetailHeroSkeleton />
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="py-20 text-center space-y-4 bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs">
        <AlertCircle size={36} className="mx-auto text-amber-500" />
        <h2 className="text-lg font-bold text-slate-900">Scholarship Not Found</h2>
        <p className="text-xs text-slate-500">The scholarship you requested may have expired or was removed.</p>
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs"
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
      <div>
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to All Scholarships</span>
        </Link>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center gap-2.5 text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {scholarship.funding_type || 'Fully Funded'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-brand-blue border border-blue-200/60 capitalize">
                {scholarship.degree_levels?.[0] || (scholarship as any).degree_level || 'All Degree Levels'}
              </span>
              {scholarship.country && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                  📍 {scholarship.country}
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {scholarship.name || (scholarship as any).title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <MapPin size={15} className="text-slate-400" />
              <span>{scholarship.organization || (scholarship as any).host_institution || scholarship.country || 'Global Host'}</span>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleSave}
              className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold shadow-xs ${
                isSaved
                  ? 'border-brand-gold bg-brand-gold/10 text-slate-900'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              {isSaved ? <BookmarkCheck size={16} className="text-brand-gold" /> : <Bookmark size={16} />}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Deadline alert banner */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-950">
                Application Deadline:{' '}
                {scholarship.deadline
                  ? formatDate(new Date(scholarship.deadline), 'MMMM d, yyyy')
                  : 'Open Rolling Admissions'}
              </p>
              {daysLeft !== null && (
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  {daysLeft > 0 ? `${daysLeft} calendar days remaining to apply` : 'Applications closing very soon'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToTracker}
              disabled={addingToTracker}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 ${
                hasApplied
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70 hover:bg-emerald-100 cursor-pointer'
                  : 'bg-brand-blue hover:bg-brand-blue/90 text-white'
              }`}
            >
              {addingToTracker ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Adding...</span>
                </>
              ) : hasApplied ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>In Application Tracker</span>
                  <ArrowRight size={13} className="text-emerald-700 ml-0.5" />
                </>
              ) : (
                <span>+ Add to Tracker</span>
              )}
            </button>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scholarship Details</p>
          <h2 className="text-base font-bold text-slate-900">Program Overview</h2>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {scholarship.description ||
              'This international scholarship program provides comprehensive tuition coverage and academic support for qualifying undergraduate and graduate scholars.'}
          </div>
        </div>

        {/* Eligibility & Requirements */}
        {scholarship.requirements && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Criteria &amp; Qualifications</p>
            <h2 className="text-base font-bold text-slate-900">Eligibility &amp; Criteria</h2>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 sm:p-5 rounded-xl border border-slate-200/80">
              {scholarship.requirements}
            </div>
          </div>
        )}

        {/* External Link & Tracker Actions */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Official instructions, application portals, and university submission guidelines.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {scholarship.application_url && (
              <a
                href={scholarship.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all hover:bg-slate-50"
              >
                <span>Official Application Portal</span>
                <ExternalLink size={14} className="text-slate-400" />
              </a>
            )}
            <button
              onClick={handleAddToTracker}
              disabled={addingToTracker}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-xs shadow-xs hover:bg-brand-blue/90 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {addingToTracker ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Adding to Tracker...</span>
                </>
              ) : hasApplied ? (
                <>
                  <span>Open in Application Tracker</span>
                  <ArrowRight size={14} />
                </>
              ) : (
                <>
                  <span>Start Application in Tracker</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
