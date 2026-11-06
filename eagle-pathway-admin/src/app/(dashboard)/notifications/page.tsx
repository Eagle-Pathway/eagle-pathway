'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Send, Users, Bell, Loader2, CheckCircle2, History,
  ExternalLink, GraduationCap, FileText, Briefcase, Link as LinkIcon
} from 'lucide-react';

interface BroadcastLog {
  id: string;
  title: string;
  body: string;
  audience: string;
  type: string;
  target_url?: string;
  notified_count: number;
  push_count: number;
  created_at: string;
}

interface ScholarshipOption {
  id: string;
  name: string;
  country: string;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: 'all', // all, student, tutor
    type: 'application_update',
  });

  const [destinationMode, setDestinationMode] = useState<'notifications' | 'scholarship' | 'documents' | 'jobs' | 'custom'>('notifications');
  const [selectedScholarshipId, setSelectedScholarshipId] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const [scholarships, setScholarships] = useState<ScholarshipOption[]>([]);
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Load scholarships for deep linking
  useEffect(() => {
    async function loadScholarships() {
      try {
        const { data } = await supabase
          .from('scholarships')
          .select('id, name, country')
          .eq('is_active', true)
          .order('name')
          .limit(50);
        if (data) {
          setScholarships(data);
          if (data.length > 0) setSelectedScholarshipId(data[0].id);
        }
      } catch (err) {
        console.warn('Failed to load scholarships for deep linking:', err);
      }
    }
    loadScholarships();
  }, []);

  // Fetch past broadcast logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/broadcast', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load broadcast logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getComputedTargetUrl = () => {
    switch (destinationMode) {
      case 'scholarship':
        return selectedScholarshipId ? `/scholarship-detail?id=${selectedScholarshipId}` : '/(tabs)/scholarships';
      case 'documents':
        return '/documents';
      case 'jobs':
        return '/tutor-jobs';
      case 'custom':
        return customUrl.trim() || '/notifications';
      default:
        return '/notifications';
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Authentication required');

      const targetUrl = getComputedTargetUrl();

      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          targetUrl,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send broadcast');
      }

      setSuccess(`Successfully broadcasted to ${result.notified_count} users (${result.push_count} push notifications sent)!`);
      setFormData({ title: '', body: '', audience: 'all', type: 'application_update' });
      setDestinationMode('notifications');
      setCustomUrl('');

      // Refresh logs
      fetchLogs();

    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Broadcast Station</div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Push Notifications & Broadcasts</h1>
        <p className="mt-1 text-xs text-slate-500">Broadcast instant push notifications and in-app alerts with targeted deep linking</p>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200/80 bg-slate-50/30">
          <div className="flex items-center mb-5">
            <div className="h-10 w-10 bg-brand-blue/10 rounded-xl flex items-center justify-center mr-3 text-brand-blue">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Create Broadcast</h2>
              <p className="text-xs text-slate-500">Draft an announcement to students or tutors</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center">
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
              <div className="flex-1 font-medium">{success}</div>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notification Title</label>
                <input
                  required type="text" name="title" value={formData.title} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                  placeholder="e.g. New Master's Scholarship Open for Application!"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  required name="body" value={formData.body} onChange={handleChange} rows={3}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors resize-none text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  placeholder="Detailed message that appears when users open or preview the notification..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <select
                    name="audience" value={formData.audience} onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-xs text-slate-900 font-medium outline-none cursor-pointer"
                  >
                    <option value="all">Everyone (Students & Tutors)</option>
                    <option value="student">Students Only</option>
                    <option value="tutor">Tutors Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notification Category</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Bell className="h-4 w-4" />
                  </div>
                  <select
                    name="type" value={formData.type} onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-xs text-slate-900 font-medium outline-none cursor-pointer"
                  >
                    <option value="application_update">General Announcement</option>
                    <option value="scholarship_alert">Scholarship Alert</option>
                    <option value="new_resource">Resource Update</option>
                  </select>
                </div>
              </div>

              {/* Deep Link Target Destination */}
              <div className="md:col-span-2 p-4 bg-slate-50/60 rounded-xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Deep Link Action (When User Taps Notification)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                  {[
                    { id: 'notifications', label: 'In-App Alert', icon: Bell },
                    { id: 'scholarship', label: 'Scholarship', icon: GraduationCap },
                    { id: 'documents', label: 'Documents', icon: FileText },
                    { id: 'jobs', label: 'Tutor Jobs', icon: Briefcase },
                    { id: 'custom', label: 'Custom URL', icon: LinkIcon },
                  ].map(dest => {
                    const Icon = dest.icon;
                    const active = destinationMode === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setDestinationMode(dest.id as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-semibold transition-all ${active
                          ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5 mb-1" />
                        <span>{dest.label}</span>
                      </button>
                    );
                  })}
                </div>

                {destinationMode === 'scholarship' && (
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Scholarship Target</label>
                    <select
                      value={selectedScholarshipId}
                      onChange={e => setSelectedScholarshipId(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200/80 text-xs font-medium text-slate-900 outline-none"
                    >
                      {scholarships.length === 0 ? (
                        <option value="">No active scholarships found</option>
                      ) : (
                        scholarships.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.country})
                          </option>
                        ))
                      )}
                    </select>
                    <p className="mt-1 text-[11px] text-brand-blue">Tapping this notification will open the scholarship detail directly.</p>
                  </div>
                )}

                {destinationMode === 'custom' && (
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Custom In-App Path or Web URL</label>
                    <input
                      type="text"
                      value={customUrl}
                      onChange={e => setCustomUrl(e.target.value)}
                      placeholder="e.g. /resources or https://eaglespathway.com"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-900 font-mono outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit" disabled={loading || !formData.title || !formData.body}
                className="flex items-center justify-center px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus:outline-none shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Broadcast Now
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Broadcast History</h3>
              <p className="text-[11px] text-slate-500">Record of recent broadcasts sent across devices</p>
            </div>
          </div>
          <button
            onClick={() => fetchLogs()}
            className="text-xs text-brand-blue font-semibold hover:underline"
          >
            Refresh Logs
          </button>
        </div>

        {logsLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-blue" />
            <p>Loading broadcast history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Bell className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No broadcasts sent yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Broadcasts will appear here with delivery counts once sent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Announcement</th>
                  <th className="py-3 px-5">Audience</th>
                  <th className="py-3 px-5">Deep Link</th>
                  <th className="py-3 px-5 text-right">Recipients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-900">{log.title}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{log.body}</p>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-brand-blue border border-blue-100 capitalize">
                        {log.audience}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {log.target_url || '/notifications'}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <span className="text-xs font-bold text-slate-900">{log.notified_count} in-app</span>
                      {log.push_count > 0 && (
                        <span className="text-[11px] text-emerald-600 font-semibold block">({log.push_count} push)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
