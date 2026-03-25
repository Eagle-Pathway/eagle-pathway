'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, GraduationCap, Calendar, UserCheck, Loader2 } from 'lucide-react';
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
    bookings: 0
  });
  
  const [roleData, setRoleData] = useState<{name: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      
      const [
        usersRes, tutorsRes, scholarshipsRes, bookingsRes,
        studentRes, tutorRoleRes, adminRes
      ] = await Promise.allSettled([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('scholarships').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin')
      ]);

      setCounts({
        users: usersRes.status === 'fulfilled' ? usersRes.value.count || 0 : 0,
        tutorsPending: tutorsRes.status === 'fulfilled' ? tutorsRes.value.count || 0 : 0,
        activeScholarships: scholarshipsRes.status === 'fulfilled' ? scholarshipsRes.value.count || 0 : 0,
        bookings: bookingsRes.status === 'fulfilled' ? bookingsRes.value.count || 0 : 0
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
    { title: 'Tutors Pending', value: counts.tutorsPending, icon: UserCheck, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
    { title: 'Active Scholarships', value: counts.activeScholarships, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Bookings', value: counts.bookings, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  // Mock activity data based on total users
  const activityData = [
    { name: 'Mon', signups: Math.max(0, counts.users - 12) },
    { name: 'Tue', signups: Math.max(0, counts.users - 8) },
    { name: 'Wed', signups: Math.max(0, counts.users - 5) },
    { name: 'Thu', signups: Math.max(0, counts.users - 3) },
    { name: 'Fri', signups: Math.max(0, counts.users - 2) },
    { name: 'Sat', signups: Math.max(0, counts.users - 1) },
    { name: 'Sun', signups: counts.users },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="mt-2 text-sm text-gray-500">Live analytics for Eagle Pathway Operations.</p>
        </div>
      </div>

      {/* Highlights Grid */}
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
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h2 className="text-lg font-bold text-gray-900 mb-6">User Signups Trend (7 Days)</h2>
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
                   <Bar dataKey="signups" fill="#1E4D9B" radius={[4, 4, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             )}
           </div>
        </div>

        {/* Pie Chart */}
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
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <a href="/scholarships" className="block p-6 rounded-xl border border-gray-100 hover:border-brand-blue/30 hover:bg-gray-50 transition-all text-center">
                <GraduationCap className="mx-auto h-8 w-8 text-brand-blue mb-3 opacity-80" />
                <h3 className="font-semibold text-gray-900">Create Scholarship</h3>
                <p className="text-xs text-gray-500 mt-1">Publish a new opportunity</p>
             </a>
             <a href="/tutors" className="block p-6 rounded-xl border border-gray-100 hover:border-brand-gold/30 hover:bg-gray-50 transition-all text-center">
                <UserCheck className="mx-auto h-8 w-8 text-brand-gold mb-3 opacity-80" />
                <h3 className="font-semibold text-gray-900">Review Tutors</h3>
                <p className="text-xs text-gray-500 mt-1">Approve pending applications</p>
             </a>
             <a href="/users" className="block p-6 rounded-xl border border-gray-100 hover:border-purple-300/30 hover:bg-gray-50 transition-all text-center">
                <Users className="mx-auto h-8 w-8 text-purple-600 mb-3 opacity-80" />
                <h3 className="font-semibold text-gray-900">Manage Users</h3>
                <p className="text-xs text-gray-500 mt-1">View the growing community</p>
             </a>
         </div>
      </div>
    </div>
  );
}
