'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Briefcase,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/date';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  type?: string;
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    async function loadNotifications() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications((data as any) || []);
      } catch (err) {
        console.warn('Load notifications error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.warn('Mark read error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Activity Center</p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Notifications &amp; Activity
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Updates on scholarship deadlines, booking confirmations, and admissions status changes.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-all"
          >
            <CheckCheck size={14} className="text-emerald-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs space-y-3">
          <Bell size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-900">All Caught Up</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any new notifications at this time.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
                !n.is_read ? 'bg-brand-blue/5' : 'hover:bg-slate-50/60'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                  !n.is_read ? 'bg-brand-blue text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Bell size={16} />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {n.created_at ? formatDate(new Date(n.created_at), 'MMM d, h:mm a') : 'Recent'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
