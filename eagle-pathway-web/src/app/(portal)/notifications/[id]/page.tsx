'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  GraduationCap,
  Briefcase,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import { DetailHeroSkeleton } from '@/components/ui/Skeletons';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type?: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuthStore();

  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id || !user?.id) return;

    async function loadNotification() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', id)
          .eq('user_id', user!.id)
          .maybeSingle();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        setNotification(data as NotificationItem);

        // Auto mark as read if unread
        if (!data.is_read) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
          setNotification((prev) => (prev ? { ...prev, is_read: true } : null));
        }
      } catch (err) {
        console.warn('Error loading notification detail:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadNotification();
  }, [id, user?.id]);

  const handleDelete = async () => {
    if (!notification || deleting) return;
    setDeleting(true);
    try {
      await supabase.from('notifications').delete().eq('id', notification.id);
      router.push('/notifications');
    } catch (err) {
      console.warn('Failed to delete notification:', err);
      setDeleting(false);
    }
  };

  const handleToggleRead = async () => {
    if (!notification) return;
    const newStatus = !notification.is_read;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: newStatus })
        .eq('id', notification.id);
      setNotification((prev) => (prev ? { ...prev, is_read: newStatus } : null));
    } catch (err) {
      console.warn('Failed to toggle read state:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        <DetailHeroSkeleton />
      </div>
    );
  }

  if (notFound || !notification) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Notification Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This notification may have been dismissed or is no longer available.
        </p>
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Back to Notifications</span>
        </Link>
      </div>
    );
  }

  // Derive Contextual Destination & Category
  const typeStr = (notification.type || '').toLowerCase();
  const titleLower = notification.title.toLowerCase();
  const bodyLower = notification.body.toLowerCase();

  let categoryLabel = 'System Alert';
  let categoryColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let CategoryIcon = Bell;
  let actionUrl: string | null = null;
  let actionLabel = 'Explore Opportunity';

  if (notification.data?.url) {
    actionUrl = notification.data.url;
    actionLabel = 'Open Destination';
  }

  if (typeStr.includes('scholarship') || titleLower.includes('scholarship') || bodyLower.includes('scholarship') || titleLower.includes('academic year') || titleLower.includes('master')) {
    categoryLabel = 'Scholarship Opportunity';
    categoryColor = 'bg-amber-50 text-amber-800 border-amber-200/70';
    CategoryIcon = GraduationCap;
    if (!actionUrl) {
      actionUrl = '/scholarships';
      actionLabel = 'Explore Scholarships';
    }
  } else if (typeStr.includes('resource') || titleLower.includes('resource') || bodyLower.includes('resource') || titleLower.includes('database') || titleLower.includes('ielts')) {
    categoryLabel = 'Academic Resource';
    categoryColor = 'bg-cyan-50 text-cyan-800 border-cyan-200/70';
    CategoryIcon = BookOpen;
    if (!actionUrl) {
      actionUrl = '/documents';
      actionLabel = 'Access Academic Resources';
    }
  } else if (typeStr.includes('booking') || typeStr.includes('session') || titleLower.includes('booking') || bodyLower.includes('booking') || titleLower.includes('session')) {
    categoryLabel = 'Tutoring Session';
    categoryColor = 'bg-emerald-50 text-emerald-800 border-emerald-200/70';
    CategoryIcon = Calendar;
    if (!actionUrl) {
      actionUrl = '/bookings';
      actionLabel = 'View Scheduled Sessions';
    }
  } else if (typeStr.includes('application') || titleLower.includes('application') || bodyLower.includes('application') || titleLower.includes('tracker')) {
    categoryLabel = 'Application Tracker';
    categoryColor = 'bg-blue-50 text-brand-blue border-blue-200/70';
    CategoryIcon = FileText;
    if (!actionUrl) {
      actionUrl = '/tracker';
      actionLabel = 'Open Application Tracker';
    }
  } else if (typeStr.includes('job') || titleLower.includes('tutor') || bodyLower.includes('tutor')) {
    categoryLabel = 'Tutor Marketplace';
    categoryColor = 'bg-indigo-50 text-indigo-800 border-indigo-200/70';
    CategoryIcon = Briefcase;
    if (!actionUrl) {
      actionUrl = '/tutor-jobs';
      actionLabel = 'View Tutor Opportunities';
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue transition-colors group"
        >
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Back to All Notifications</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Check size={13} className={notification.is_read ? 'text-emerald-600' : 'text-slate-400'} />
            <span>{notification.is_read ? 'Marked as Read' : 'Mark as Read'}</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span>{deleting ? 'Removing...' : 'Dismiss'}</span>
          </button>
        </div>
      </div>

      {/* Main Notification Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
        {/* Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${categoryColor}`}
            >
              <CategoryIcon size={13} />
              <span>{categoryLabel}</span>
            </span>

            {notification.is_read ? (
              <span className="text-[11px] font-medium text-slate-400 inline-flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Read
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-blue text-white uppercase tracking-wider">
                New
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Clock size={13} />
            <span>
              {notification.created_at
                ? formatDate(new Date(notification.created_at), 'EEEE, MMMM d, yyyy') +
                  ' at ' +
                  formatDate(new Date(notification.created_at), 'h:mm a')
                : 'Recent Notification'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {notification.title}
          </h1>
        </div>

        {/* Message Body */}
        <div className="bg-slate-50/75 rounded-xl border border-slate-200/60 p-5 md:p-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-normal">
          {notification.body}
        </div>

        {/* Action Button CTA */}
        {actionUrl && (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Related service is ready for direct access in your portal:
            </p>
            <Link
              href={actionUrl}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-all shadow-xs"
            >
              <span>{actionLabel}</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

