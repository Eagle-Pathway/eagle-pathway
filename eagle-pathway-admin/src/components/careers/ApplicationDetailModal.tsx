'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Feedback';
import { JobApplication, ApplicationStatus } from '@/types/careers';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Download,
  FileText,
  Briefcase,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Save,
  Loader2,
} from 'lucide-react';

function LinkedInIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplication | null;
  onUpdate: (updated: JobApplication) => void;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: 'Pending Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  reviewing: {
    label: 'Under Review',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  interviewed: {
    label: 'Interviewed',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  offered: {
    label: 'Offer Extended',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  rejected: {
    label: 'Not Selected',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  application,
  onUpdate,
}: ApplicationDetailModalProps) {
  const toast = useToast();

  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(
    application?.status || 'pending'
  );
  const [notes, setNotes] = useState(application?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state when application changes
  if (!isOpen || !application) return null;

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    setCurrentStatus(newStatus);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/admin/careers/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');

      toast('success', `Candidate moved to "${STATUS_CONFIG[newStatus].label}".`);
      onUpdate(data.application);
    } catch (err: any) {
      console.error('Update status error:', err);
      toast('error', err.message || 'Failed to update candidate status.');
      setCurrentStatus(application.status);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/admin/careers/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save notes.');

      toast('success', 'Internal notes saved.');
      onUpdate(data.application);
    } catch (err: any) {
      console.error('Save notes error:', err);
      toast('error', err.message || 'Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(application.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('info', 'Email copied to clipboard.');
  };

  const formattedDate = new Date(application.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
              {application.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{application.full_name}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    STATUS_CONFIG[currentStatus].bg
                  } ${STATUS_CONFIG[currentStatus].text} ${STATUS_CONFIG[currentStatus].border}`}
                >
                  {STATUS_CONFIG[currentStatus].label}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Briefcase size={12} className="text-slate-400" />
                <span>Applied for:</span>
                <span className="font-semibold text-slate-700">{application.job_title}</span>
                <span>•</span>
                <Clock size={12} className="text-slate-400" />
                <span>{formattedDate}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Contact & Links Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Contact Information
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    {application.email}
                  </span>
                  <button
                    onClick={copyEmail}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    title="Copy Email"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Phone size={14} className="text-slate-400" />
                  <a href={`tel:${application.phone}`} className="hover:underline">
                    {application.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Professional Profiles & Artifacts
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {application.resume_url ? (
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download size={13} />
                    View / Download CV
                    <ExternalLink size={11} className="opacity-80" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">No CV uploaded</span>
                )}

                {application.linkedin_url && (
                  <a
                    href={application.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <LinkedInIcon size={13} />
                    LinkedIn
                    <ExternalLink size={11} />
                  </a>
                )}

                {application.portfolio_url && (
                  <a
                    href={application.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Globe size={13} />
                    Portfolio
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Hiring Pipeline Stage Mover */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
              Move Candidate in Hiring Pipeline
            </span>
            <div className="flex flex-wrap gap-2">
              {(['pending', 'reviewing', 'interviewed', 'offered', 'rejected'] as ApplicationStatus[]).map(
                (st) => {
                  const isSelected = currentStatus === st;
                  const cfg = STATUS_CONFIG[st];
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-blue-500/20`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={15} className="text-blue-600" />
                Cover Letter & Candidate Statement
              </span>
              {application.cover_letter && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(application.cover_letter || '');
                    toast('info', 'Cover letter copied.');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <Copy size={12} /> Copy
                </button>
              )}
            </div>
            {application.cover_letter ? (
              <div className="bg-white rounded-lg p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">
                {application.cover_letter}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No cover letter submitted.</p>
            )}
          </div>

          {/* Internal Admin Notes */}
          <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Internal Team Notes & Evaluation
              </span>
              <span className="text-[11px] text-slate-400">Only visible to administrators</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Record interviewer remarks, salary expectations, next steps, or technical assessment score..."
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {savingNotes ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Save Notes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

