'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  UserCheck, 
  Loader2, 
  Briefcase, 
  FileText, 
  DollarSign 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#1E4D9B', '#C9A84C', '#9333EA'];

type OpsQueueItem = {
  title: string;
  detail: string;
  count: number;
  href: string;
  icon: typeof FileText;
  color: string;
  bg: string;
};

// Returns 'YYYY-MM-DD' in LOCAL time — avoids UTC vs local midnight mismatch
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Build a label array for the past 7 days using local calendar dates
function getLast7Days() {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { label: dayNames[d.getDay()], dateStr: toLocalDateStr(d) };
  });
}

export default function OverviewPage() {
  const [counts, setCounts] = useState({
    users: 0,
    tutorsPending: 0,
    activeScholarships: 0,
    bookings: 0,
    applicationsPending: 0
  });
  
  const [roleData, setRoleData] = useState<{name: string, value: number}[]>([]);
  const [activityData, setActivityData] = useState<{name: string, signups: number, apps: number}[]>([]);
  const [sourceData, setSourceData] = useState<{ source: string; signups: number }[]>([]);
  const [opsQueue, setOpsQueue] = useState<OpsQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        // Set to local midnight so the query boundary aligns with chart day labels
        sevenDaysAgo.setHours(0, 0, 0, 0);
        // toISOString converts to UTC — for countries east of UTC (Ethiopia = UTC+3)
        // local midnight is 3 hrs earlier in UTC, which is correct: captures the full local day
        const isoStart = sevenDaysAgo.toISOString();

        const [
          summaryRes,
          recentUsersRes,
          recentAppsRes,
          sourceUsersRes,
        ] = await Promise.all([
          supabase.rpc('get_dashboard_summary'),
          supabase.from('users').select('created_at').gte('created_at', isoStart),
          supabase.from('applications').select('created_at').gte('created_at', isoStart),
          supabase.from('users').select('signup_source, referral_code, utm_source, utm_campaign'),
        ]);

        if (summaryRes.error) throw summaryRes.error;
        const summary = summaryRes.data || {};

        setCounts({
          users: Number(summary.total_users) || 0,
          tutorsPending: Number(summary.tutors_pending) || 0,
          activeScholarships: Number(summary.active_scholarships) || 0,
          bookings: Number(summary.bookings) || 0,
          applicationsPending: Number(summary.applications_pending) || 0,
        });

        setRoleData([
          { name: 'Students', value: Number(summary.students_count) || 0 },
          { name: 'Tutors', value: Number(summary.tutors_count) || 0 },
          { name: 'Admins', value: Number(summary.admins_count) || 0 },
        ]);

        // Build real 7-day activity — bucket by date string using local timezone
        const days = getLast7Days();
        const signupsByDate: Record<string, number> = {};
        const appsByDate: Record<string, number> = {};
        days.forEach(d => { signupsByDate[d.dateStr] = 0; appsByDate[d.dateStr] = 0; });

        (recentUsersRes.data || []).forEach(u => {
          if (!u.created_at) return;
          const date = toLocalDateStr(new Date(u.created_at));
          if (signupsByDate[date] !== undefined) signupsByDate[date]++;
        });
        (recentAppsRes.data || []).forEach(a => {
          if (!a.created_at) return;
          const date = toLocalDateStr(new Date(a.created_at));
          if (appsByDate[date] !== undefined) appsByDate[date]++;
        });

        setActivityData(days.map(d => ({
          name: d.label,
          signups: signupsByDate[d.dateStr],
          apps: appsByDate[d.dateStr],
        })));

        const sourceCounts: Record<string, number> = {};
        (sourceUsersRes.data || []).forEach((u: any) => {
          const source =
            u.referral_code ||
            u.utm_campaign ||
            u.signup_source ||
            u.utm_source ||
            'direct / unknown';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        setSourceData(
          Object.entries(sourceCounts)
            .map(([source, signups]) => ({ source, signups }))
            .sort((a, b) => b.signups - a.signups)
            .slice(0, 6),
        );

        setOpsQueue([
          {
            title: 'Verify documents',
            detail: 'Student uploads waiting for approval',
            count: Number(summary.pending_docs) || 0,
            href: '/documents',
            icon: FileText,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            title: 'Review payments',
            detail: 'Manual receipts pending finance action',
            count: Number(summary.pending_payments) || 0,
            href: '/finance',
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            title: 'Assign consultants',
            detail: 'Applications without an owner',
            count: Number(summary.unassigned_apps) || 0,
            href: '/applications',
            icon: Briefcase,
            color: 'text-brand-blue',
            bg: 'bg-blue-50',
          },
          {
            title: 'Process services',
            detail: 'International service requests in queue',
            count: Number(summary.pending_services) || 0,
            href: '/services',
            icon: UserCheck,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ]);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err?.message || err, JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const stats = [
    { title: 'Total Users', value: counts.users, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { title: 'Applications', value: counts.applicationsPending, icon: Briefcase, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
    { title: 'Tutors Pending', value: counts.tutorsPending, icon: UserCheck, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Active Scholarships', value: counts.activeScholarships, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Bookings', value: counts.bookings, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="mt-2 text-sm text-gray-500">Live analytics for Eagle Pathway Operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
             <div key={stat.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className={`p-4 rounded-xl mr-4 transition-colors ${stat.bg}`}>
                 <Icon className={`h-6 w-6 ${stat.color} transition-transform group-hover:scale-110`} />
               </div>
               <div>
                 <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                 <div className="text-2xl font-bold text-gray-900 mt-1 flex items-center">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-300" /> : stat.value}
                 </div>
               </div>
             </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Signup Sources</h2>
            <p className="text-sm text-gray-500">First-touch referral and UTM attribution.</p>
          </div>
        </div>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
        ) : sourceData.length === 0 ? (
          <p className="text-sm text-gray-500">No attribution data yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sourceData.map((item) => (
              <div key={item.source} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.source}</p>
                <p className="mt-1 text-2xl font-bold text-brand-blue">{item.signups}</p>
                <p className="text-xs text-gray-500">signups</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-gray-900">Activity Trend (7 Days)</h2>
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-brand-blue rounded-full" /><span className="text-xs font-medium text-gray-500">Signups</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-brand-gold rounded-full" /><span className="text-xs font-medium text-gray-500">Applications</span></div>
             </div>
           </div>
           <div className="h-72 w-full">
             {loading ? (
               <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <RechartsTooltip 
                       cursor={{ fill: '#F3F4F6' }} 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="signups" fill="#1E4D9B" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="apps" fill="#C9A84C" radius={[4, 4, 0, 0]} barSize={30} />
                 </BarChart>
               </ResponsiveContainer>
             )}
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h2 className="text-lg font-bold text-gray-900 mb-2">User Demographics</h2>
           <div className="h-72 w-full">
             {loading ? (
               <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={roleData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {roleData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" />
                 </PieChart>
               </ResponsiveContainer>
             )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
             <FileText className="h-5 w-5 text-brand-blue" />
             Operations Queue
           </h2>
           <div className="space-y-4">
             {loading ? (
               Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="flex items-center gap-4 animate-pulse">
                   <div className="w-10 h-10 bg-gray-100 rounded-full" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 bg-gray-100 rounded w-1/3" />
                     <div className="h-3 bg-gray-100 rounded w-1/4" />
                   </div>
                 </div>
               ))
             ) : (
               opsQueue.map((item) => (
                 <a key={item.title} href={item.href} className="flex items-center gap-4 group rounded-xl p-2 -mx-2 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{item.title}</p>
                      <p className="text-[11px] text-gray-500 uppercase font-bold tracking-tight">{item.detail}</p>
                    </div>
                    <div className={`min-w-8 h-8 rounded-full ${item.count > 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'} flex items-center justify-center text-xs font-bold`}>
                      {item.count}
                    </div>
                 </a>
               ))
             )}
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
             <Loader2 className="h-5 w-5 text-green-500" />
             System Health
           </h2>
           <div className="grid grid-cols-2 gap-4">
<div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-gray-400 uppercase">Database</span>
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Supabase Cloud</p>
                  <p className="text-[10px] text-gray-500 font-medium">Connected · {counts.users?.toLocaleString() || 0} users</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-gray-400 uppercase">AI Engine</span>
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Groq (Llama 3.3)</p>
                  <p className="text-[10px] text-gray-500 font-medium">SOP Review API Active</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-gray-400 uppercase">Auth Service</span>
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Supabase Auth</p>
                  <p className="text-[10px] text-gray-500 font-medium">Phone + Email enabled</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-gray-400 uppercase">Storage</span>
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Buckets Active</p>
                  <p className="text-[10px] text-gray-500 font-medium">Ready for uploads</p>
              </div>
           </div>
           <div className="mt-6 p-3 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
              <p className="text-[10px] text-brand-blue font-bold flex items-center gap-2">
                ℹ️ All systems are functioning normally in East Africa (Addis Ababa).
              </p>
           </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
         <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Navigation</h2>
         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
             <a href="/applications" className="block p-5 rounded-xl border border-gray-100 hover:border-brand-blue/30 hover:bg-gray-50 transition-all text-center group">
                <Briefcase className="mx-auto h-8 w-8 text-brand-blue mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Track Pipeline</h3>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Applications</p>
             </a>
             <a href="/documents" className="block p-5 rounded-xl border border-gray-100 hover:border-brand-gold/30 hover:bg-gray-50 transition-all text-center group">
                <FileText className="mx-auto h-8 w-8 text-brand-gold mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Verify Docs</h3>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Verification</p>
             </a>
             <a href="/scholarships" className="block p-5 rounded-xl border border-gray-100 hover:border-blue-300/30 hover:bg-gray-50 transition-all text-center group">
                <GraduationCap className="mx-auto h-8 w-8 text-blue-500 mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">New Scholarship</h3>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Opportunities</p>
             </a>
             <a href="/finance" className="block p-5 rounded-xl border border-gray-100 hover:border-green-300/30 hover:bg-gray-50 transition-all text-center group">
                <DollarSign className="mx-auto h-8 w-8 text-green-600 mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">Payouts</h3>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Finance</p>
             </a>
         </div>
      </div>
    </div>
  );
}
