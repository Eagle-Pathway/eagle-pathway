'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, GraduationCap, Calendar, UserCheck, Loader2 } from 'lucide-react';

export default function OverviewPage() {
  const [counts, setCounts] = useState({
    users: 0,
    tutorsPending: 0,
    activeScholarships: 0,
    bookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      
      const [usersRes, tutorsRes, scholarshipsRes, bookingsRes] = await Promise.allSettled([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('scholarships').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bookings').select('*', { count: 'exact', head: true })
      ]);

      setCounts({
        users: usersRes.status === 'fulfilled' ? usersRes.value.count || 0 : 0,
        tutorsPending: tutorsRes.status === 'fulfilled' ? tutorsRes.value.count || 0 : 0,
        activeScholarships: scholarshipsRes.status === 'fulfilled' ? scholarshipsRes.value.count || 0 : 0,
        bookings: bookingsRes.status === 'fulfilled' ? bookingsRes.value.count || 0 : 0
      });
      
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
