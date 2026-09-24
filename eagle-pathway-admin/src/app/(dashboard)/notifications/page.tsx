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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Push Notifications & Broadcasts</h1>
        <p className="mt-1 text-sm text-gray-500">Broadcast instant push notifications and in-app alerts with targeted deep linking.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center mb-6">
             <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4 text-purple-600">
               <Bell className="h-6 w-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-900">Create Broadcast</h2>
               <p className="text-sm text-gray-500">Draft an announcement to students or tutors</p>
             </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-200 text-red-600 rounded-xl text-sm flex items-center">
               <div className="flex-1">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50/80 border border-green-200 text-green-700 rounded-xl text-sm flex items-center">
               <CheckCircle2 className="w-5 h-5 mr-2" />
               <div className="flex-1 font-medium">{success}</div>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notification Title</label>
                 <input 
                   required type="text" name="title" value={formData.title} onChange={handleChange} 
                   className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-colors font-medium text-gray-900 placeholder-gray-400" 
                   placeholder="e.g. New Master's Scholarship Open for Application!" 
                 />
               </div>

               <div className="md:col-span-2">
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Content</label>
                 <textarea 
                   required name="body" value={formData.body} onChange={handleChange} rows={3} 
                   className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-colors resize-none text-gray-900 placeholder-gray-400" 
                   placeholder="Detailed message that appears when users open or preview the notification..."
                 />
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Audience</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                     <Users className="h-4 w-4" />
                   </div>
                   <select 
                     name="audience" value={formData.audience} onChange={handleChange} 
                     className="w-full pl-10 pr-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 appearance-none text-gray-900 font-medium"
                   >
                     <option value="all">Everyone (Students & Tutors)</option>
                     <option value="student">Students Only</option>
                     <option value="tutor">Tutors Only</option>
                   </select>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notification Category</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                     <Bell className="h-4 w-4" />
                   </div>
                   <select 
                     name="type" value={formData.type} onChange={handleChange} 
                     className="w-full pl-10 pr-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 appearance-none text-gray-900 font-medium"
                   >
                     <option value="application_update">General Announcement</option>
                     <option value="scholarship_alert">Scholarship Alert</option>
                     <option value="new_resource">Resource Update</option>
                   </select>
                 </div>
               </div>

               {/* Deep Link Target Destination */}
               <div className="md:col-span-2 p-5 bg-purple-50/40 rounded-2xl border border-purple-100">
                 <label className="block text-sm font-bold text-gray-900 mb-2">
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
                         className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                           active 
                             ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                             : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                         }`}
                       >
                         <Icon className="w-4 h-4 mb-1" />
                         <span>{dest.label}</span>
                       </button>
                     );
                   })}
                 </div>

                 {destinationMode === 'scholarship' && (
                   <div className="mt-3">
                     <label className="block text-xs font-semibold text-gray-600 mb-1">Select Scholarship Target</label>
                     <select
                       value={selectedScholarshipId}
                       onChange={e => setSelectedScholarshipId(e.target.value)}
                       className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-900"
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
                     <p className="mt-1 text-xs text-purple-700">Tapping this notification will open the scholarship detail directly.</p>
                   </div>
                 )}

                 {destinationMode === 'custom' && (
                   <div className="mt-3">
                     <label className="block text-xs font-semibold text-gray-600 mb-1">Custom In-App Path or Web URL</label>
                     <input
                       type="text"
                       value={customUrl}
                       onChange={e => setCustomUrl(e.target.value)}
                       placeholder="e.g. /resources or https://eaglespathway.com"
                       className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 font-mono"
                     />
                   </div>
                 )}
               </div>
             </div>

             <div className="pt-2 flex justify-end">
               <button 
                 type="submit" disabled={loading || !formData.title || !formData.body} 
                 className="flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600/50 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-95"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                 Send Broadcast Now
               </button>
             </div>
          </form>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Broadcast History</h3>
              <p className="text-xs text-gray-500">Record of recent broadcasts sent across mobile devices</p>
            </div>
          </div>
          <button
            onClick={() => fetchLogs()}
            className="text-xs text-purple-600 font-semibold hover:underline"
          >
            Refresh Logs
          </button>
        </div>

        {logsLoading ? (
          <div className="p-8 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-sm">Loading broadcast history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">No broadcasts sent yet</p>
            <p className="text-xs text-gray-400 mt-1">Broadcasts will appear here with delivery counts once sent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Announcement</th>
                  <th className="py-3 px-6">Audience</th>
                  <th className="py-3 px-6">Deep Link</th>
                  <th className="py-3 px-6 text-right">Recipients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString(undefined, { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-gray-900">{log.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{log.body}</p>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 capitalize">
                        {log.audience}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {log.target_url || '/notifications'}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap text-right">
                      <span className="text-xs font-bold text-gray-900">{log.notified_count} in-app</span>
                      {log.push_count > 0 && (
                        <span className="text-xs text-green-600 block">({log.push_count} push)</span>
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
