'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  LayoutDashboard, 
  LogOut,
  Calendar,
  Bell,
  DollarSign,
  Settings2,
  FileText,
  Briefcase,
  MessageSquare,
  Globe,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingFinanceCount, setPendingFinanceCount] = useState(0);
  const [pendingTutorCount, setPendingTutorCount] = useState(0);
  const [pendingDocCount, setPendingDocCount] = useState(0);

  async function fetchOperationalCounts() {
    if (!user) return;
    try {
      const [
        { count: msgCount },
        { count: financeCount },
        { data: tutorUsers },
        { data: verifiedTutors },
        { count: docCount },
      ] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('is_read', false),
        supabase.from('payments').select('*', { count: 'exact', head: true }).in('verification_status', ['manual_review', 'pending_verification']),
        supabase.from('users').select('id, role, active_role, roles'),
        supabase.from('tutors').select('user_id').eq('is_verified', true),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const verifiedSet = new Set((verifiedTutors || []).map((t: any) => t.user_id));
      const pendingTutorTotal = (tutorUsers || []).filter((u: any) => 
        (u.role === 'tutor' || u.active_role === 'tutor' || (Array.isArray(u.roles) && u.roles.includes('tutor'))) &&
        !verifiedSet.has(u.id)
      ).length;

      setUnreadCount(msgCount || 0);
      setPendingFinanceCount(financeCount || 0);
      setPendingTutorCount(pendingTutorTotal);
      setPendingDocCount(docCount || 0);
    } catch (e) {
      console.warn('Sidebar operational counts fetch fallback:', e);
    }
  }

  useEffect(() => {
    if (user) {
      fetchOperationalCounts();
      
      const channel = supabase
        .channel('sidebar-ops-counts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchOperationalCounts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchOperationalCounts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tutor_applications' }, () => fetchOperationalCounts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchOperationalCounts())
        .subscribe();

      const handleChatRead = () => fetchOperationalCounts();
      window.addEventListener('chat_read_event', handleChatRead);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('chat_read_event', handleChatRead);
      };
    }
  }, [user]);

  const navigation = [
    { name: 'Overview', href: '/overview', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Tutor Approvals', href: '/tutors', icon: UserCheck, badge: pendingTutorCount, badgeColor: 'bg-amber-500' },
    { name: 'Tutor Jobs', href: '/tutor-jobs', icon: ClipboardList },
    { name: 'Documents', href: '/documents', icon: FileText, badge: pendingDocCount, badgeColor: 'bg-blue-500' },
    { name: 'Applications', href: '/applications', icon: Briefcase },
    { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
    { name: 'Success Stories', href: '/success-stories', icon: Award },
    { name: 'Resources', href: '/resources', icon: BookOpen },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Service Requests', href: '/services', icon: Globe },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Chat', href: '/chat', icon: MessageSquare, badge: unreadCount, badgeColor: 'bg-red-500' },
    { name: 'Finance', href: '/finance', icon: DollarSign, badge: pendingFinanceCount, badgeColor: 'bg-emerald-600' },
    { name: 'Settings', href: '/settings', icon: Settings2 },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-20 transition-all duration-300 relative`}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 text-gray-500 z-30 transition-transform hover:scale-110"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-gray-100 overflow-hidden`}>
        {isCollapsed ? (
          <Image
            src="/icon.png"
            alt="Eagle Pathway"
            width={40}
            height={40}
            className="h-10 w-10 flex-shrink-0 rounded-xl shadow-md shadow-brand-blue/20"
          />
        ) : (
          <Image
            src="/logo.png"
            alt="Eagle Pathway Admin"
            width={180}
            height={48}
            className="h-12 w-auto flex-shrink-0 animate-in fade-in duration-300"
            priority
          />
        )}
      </div>

      <div className={`flex-1 py-6 ${isCollapsed ? 'px-2' : 'px-4'} space-y-1 overflow-y-auto overflow-x-hidden`}>
        {!isCollapsed && <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu</div>}
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-brand-blue/10 text-brand-blue font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`}
            >
              <Icon className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 ${isActive ? 'text-brand-blue' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!isCollapsed && <span className="flex-1 truncate animate-in slide-in-from-left-2 duration-300">{item.name}</span>}
              
              {item.badge && item.badge > 0 ? (
                <span className={`${isCollapsed ? 'absolute top-1 right-1' : 'ml-2'} px-2 py-0.5 ${item.badgeColor || 'bg-red-500'} text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className={`p-4 border-t border-gray-100 overflow-hidden`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-2'} py-3 mb-2`}>
          <div className="h-8 w-8 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
             <span className="text-brand-gold text-xs font-bold">{user?.email?.charAt(0).toUpperCase()}</span>
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex-1 min-w-0 animate-in fade-in duration-300">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Log out' : ''}
          className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors`}
        >
          <LogOut className={`${isCollapsed ? '' : 'mr-3'} h-4 w-4 flex-shrink-0`} />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Log out</span>}
        </button>
      </div>
    </div>
  );
}
