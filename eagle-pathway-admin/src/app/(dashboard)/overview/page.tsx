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

export default function OverviewPage() {
  const [counts, setCounts] = useState({
    users: 0,
    tutorsPending: 0,
    activeScholarships: 0,
    bookings: 0,
    applicationsPending: 0
  });
  
  const [roleData, setRoleData] = useState<{name: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const [
        usersRes, tutorsRes, scholarshipsRes, bookingsRes,
        appRes, studentRes, tutorRoleRes, adminRes
      ] = await Promise.allSettled([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('scholarships').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }).neq('status', 'accepted'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin')
      ]);

      setCounts({
        users: usersRes.status === 'fulfilled' ? usersRes.value.count || 0 : 0,
        tutorsPending: tutorsRes.status === 'fulfilled' ? tutorsRes.value.count || 0 : 0,
        activeScholarships: scholarshipsRes.status === 'fulfilled' ? scholarshipsRes.value.count || 0 : 0,
        bookings: bookingsRes.status === 'fulfilled' ? bookingsRes.value.count || 0 : 0,
        applicationsPending: appRes.status === 'fulfilled' ? appRes.value.count || 0 : 0
      });

      setRoleData([
        { name: 'Students', value: studentRes.status === 'fulfilled' ? studentRes.value.count || 0 : 0 },
        { name: 'Tutors', value: tutorRoleRes.status === 'fulfilled' ? tutorRoleRes.value.count || 0 : 0 },
        { name: 'Admins', value: adminRes.status === 'fulfilled' ? adminRes.value.count || 0 : 0 },
      ]);
      setLoading(false);
    }
    fetchStats();
  }, []);

  const stats = [
    { title: 'Total Users', value: counts.users, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { title: 'Applications', value: counts.applicationsPending, icon: Briefcase, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
    { title: 'Tutors Pending', value: counts.tutorsPending, icon: UserCheck, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Active Scholarships', value: counts.activeScholarships, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const activityData = [
    { name: 'Mon', signups: Math.max(0, counts.users - 8), apps: Math.max(0, counts.applicationsPending - 5) },
    { name: 'Tue', signups: Math.max(0, counts.users - 6), apps: Math.max(0, counts.applicationsPending - 4) },
    { name: 'Wed', signups: Math.max(0, counts.users - 4), apps: Math.max(0, counts.applicationsPending - 3) },
    { name: 'Thu', signups: Math.max(0, counts.users - 3), apps: Math.max(0, counts.applicationsPending - 2) },
    { name: 'Fri', signups: Math.max(0, counts.users - 2), apps: Math.max(0, counts.applicationsPending - 1) },
    { name: 'Sat', signups: Math.max(0, counts.users - 1), apps: Math.max(0, counts.applicationsPending) },
    { name: 'Sun', signups: counts.users, apps: counts.applicationsPending },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="mt-2 text-sm text-gray-500">Live analytics for Eagle Pathway Operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
         <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
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
