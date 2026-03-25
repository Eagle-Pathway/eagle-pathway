'use client';

import { Users, GraduationCap, Calendar, UserCheck } from 'lucide-react';

export default function OverviewPage() {
  const stats = [
    { title: 'Total Users', value: '0', icon: Users, color: 'text-brand-blue' },
    { title: 'Tutors Pending', value: '0', icon: UserCheck, color: 'text-brand-gold' },
    { title: 'Active Scholarships', value: '0', icon: GraduationCap, color: 'text-green-600' },
    { title: 'Total Bookings', value: '0', icon: Calendar, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="mt-2 text-sm text-gray-500">Welcome to your Eagle Pathway dashboard.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
             <div key={stat.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
               <div className={`p-4 rounded-xl bg-gray-50 mr-4 ${stat.color}`}>
                 <Icon className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                 <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
               </div>
             </div>
          );
        })}
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
         <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
         <div className="text-center py-10 text-gray-500 text-sm">
            Activity stream will appear here
         </div>
      </div>
    </div>
  );
}
