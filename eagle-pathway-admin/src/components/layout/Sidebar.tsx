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
  ClipboardList,
  Building2
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingFinanceCount, setPendingFinanceCount] = useState(0);
  const [pendingTutorCount, setPendingTutorCount] = useState(0);
  const [pendingDocCount, setPendingDocCount] = useState(0);
  const [pendingCareerAppCount, setPendingCareerAppCount] = useState(0);

  async function fetchOperationalCounts() {
    if (!user) return;
    try {
      const [
        { count: msgCount },
        { count: financeCount },
        { count: pendingTutorTotal },
        { count: docCount },
        { count: careerAppsCount },
      ] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('is_read', false),
        supabase.from('payments').select('*', { count: 'exact', head: true }).in('verification_status', ['manual_review', 'pending_verification']),
        supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setUnreadCount(msgCount || 0);
      setPendingFinanceCount(financeCount || 0);
      setPendingTutorCount(pendingTutorTotal || 0);
      setPendingDocCount(docCount || 0);
      setPendingCareerAppCount(careerAppsCount || 0);
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tutors' }, () => fetchOperationalCounts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchOperationalCounts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, () => fetchOperationalCounts())
        .subscribe();

      const handleChatRead = () => fetchOperationalCounts();
      const handleTutorUpdate = () => fetchOperationalCounts();
      window.addEventListener('chat_read_event', handleChatRead);
      window.addEventListener('tutor_count_updated', handleTutorUpdate);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('chat_read_event', handleChatRead);
        window.removeEventListener('tutor_count_updated', handleTutorUpdate);
      };
    }
  }, [user]);

  const navigation = [
    { name: 'Overview', href: '/overview', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Tutor Approvals', href: '/tutors', icon: UserCheck, badge: pendingTutorCount, badgeColor: 'bg-amber-500' },
    { name: 'Tutor Jobs', href: '/tutor-jobs', icon: ClipboardList },
    { name: 'Careers & Hiring', href: '/careers', icon: Building2, badge: pendingCareerAppCount, badgeColor: 'bg-indigo-500' },
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
    <div className={`${isCollapsed ? 'w-18' : 'w-60'} bg-white border-r border-slate-200/80 flex flex-col h-full shadow-xs z-20 transition-all duration-200 relative`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1 shadow-xs hover:bg-slate-50 text-slate-500 z-30 transition-transform hover:scale-105"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Logo Header */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-5'} border-b border-slate-200/80 overflow-hidden`}>
        {isCollapsed ? (
          <Image
            src="/brand/icon-light.svg"
            alt="Eagle Pathway"
            width={36}
            height={36}
            className="h-8 w-8 flex-shrink-0"
            unoptimized
            priority
          />
        ) : (
          <Image
            src="/brand/logo-light-no-global.svg"
            alt="Eagle Pathway"
            width={160}
            height={40}
            className="h-9 w-auto flex-shrink-0 animate-in fade-in duration-200"
            unoptimized
            priority
          />
        )}
      </div>

      {/* Navigation Menu */}
      <div className={`flex-1 py-4 ${isCollapsed ? 'px-2' : 'px-3'} space-y-1 overflow-y-auto overflow-x-hidden`}>
        {!isCollapsed && (
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2.5">
            Menu
          </div>
        )}
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-2.5'} py-2 rounded-lg text-xs font-semibold transition-all duration-150 group relative ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`${isCollapsed ? '' : 'mr-2.5'} h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
              {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
              
              {item.badge && item.badge > 0 ? (
                <span className={`${isCollapsed ? 'absolute top-1 right-1' : 'ml-2'} px-1.5 py-0.2 text-[10px] font-bold rounded-full transition-colors ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : item.name === 'Documents'
                      ? 'bg-blue-50 text-brand-blue border border-blue-200/60'
                      : item.name === 'Chat'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-slate-200/80 overflow-hidden">
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-2'} py-2 mb-1`}>
          <div className="h-7 w-7 rounded-full bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/30 flex items-center justify-center flex-shrink-0 text-xs font-bold">
             <span>{user?.email?.charAt(0).toUpperCase()}</span>
          </div>
          {!isCollapsed && (
            <div className="ml-2.5 flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.email}</p>
              <p className="text-[11px] text-slate-400 truncate">Administrator</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Log out' : ''}
          className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'px-2.5'} py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors`}
        >
          <LogOut className={`${isCollapsed ? '' : 'mr-2.5'} h-3.5 w-3.5 flex-shrink-0`} />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}
