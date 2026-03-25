'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  LayoutDashboard, 
  LogOut,
  Calendar
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navigation = [
    { name: 'Overview', href: '/overview', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Tutor Approvals', href: '/tutors', icon: UserCheck },
    { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-20">
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <div className="h-10 w-10 bg-brand-blue rounded-xl flex items-center justify-center mr-3 shadow-md shadow-brand-blue/20">
          <span className="text-white text-xl">🦅</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Admin</h1>
          <p className="text-xs text-gray-500">Eagle Pathway</p>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu</div>
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-brand-blue/10 text-brand-blue font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-blue' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center px-2 py-3 mb-2">
          <div className="h-8 w-8 rounded-full bg-brand-gold/20 flex items-center justify-center mr-3">
             <span className="text-brand-gold text-xs font-bold">{user?.email?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 truncate">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
