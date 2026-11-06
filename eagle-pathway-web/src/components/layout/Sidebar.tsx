'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Briefcase,
  FolderOpen,
  Package,
  MessageSquare,
  Sparkles,
  ClipboardList,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Shield,
  Wallet,
  Wand2,
  Award,
  BookOpen,
  Star,
  Settings,
  UserPlus,
  FileCheck,
  Smartphone,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  highlight?: boolean;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  unreadMessages?: number;
}

export default function Sidebar({ unreadMessages = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = (user?.role || 'student').toLowerCase();
  const isTutor = role === 'tutor';
  const isParent = role === 'parent';

  // Navigation Items per Role
  const studentSections: NavSection[] = [
    {
      title: 'Main Hub',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
        { name: 'Find Tutors', href: '/tutors', icon: Users },
        { name: 'Request Tutor', href: '/request-tutor', icon: Sparkles, badge: 'New' },
        { name: 'Tracker', href: '/tracker', icon: Briefcase },
        { name: 'Sessions', href: '/bookings', icon: Calendar },
      ],
    },
    {
      title: 'AI Suite',
      items: [
        { name: 'Eagle AI Assistant', href: '/assistant', icon: Sparkles, highlight: true },
        { name: 'SOP Reviewer', href: '/tools/sop', icon: Award },
        { name: 'Mock Interview', href: '/tools/interview', icon: Award },
        { name: 'Magic Draft', href: '/tools/magic-draft', icon: Wand2 },
      ],
    },
    {
      title: 'Tools & Prep',
      items: [
        { name: 'Study Resources', href: '/resources', icon: BookOpen },
        { name: 'Success Stories', href: '/success-stories', icon: Star },
        { name: 'Document Vault', href: '/documents', icon: FolderOpen },
        { name: 'Services & Packages', href: '/services', icon: FileCheck },
      ],
    },
  ];

  const tutorSections: NavSection[] = [
    {
      title: 'Teaching Hub',
      items: [
        { name: 'Tutor Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Tutoring Jobs', href: '/tutor-jobs', icon: ClipboardList, badge: 'Live' },
        { name: 'My Sessions', href: '/bookings', icon: Calendar },
        { name: 'Earnings & Payouts', href: '/earnings', icon: Wallet, highlight: true },
      ],
    },
    {
      title: 'Resources',
      items: [
        { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
        { name: 'Teaching Materials', href: '/resources', icon: BookOpen },
        { name: 'Eagle AI Assistant', href: '/assistant', icon: Sparkles },
      ],
    },
  ];

  const parentSections: NavSection[] = [
    {
      title: 'Family Portal',
      items: [
        { name: 'Parent Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Children', href: '/parent/children', icon: Users, badge: 'Track' },
        { name: 'Book a Tutor', href: '/request-tutor', icon: Sparkles, highlight: true },
        { name: 'Children Sessions', href: '/bookings', icon: Calendar },
        { name: 'Find Tutors', href: '/tutors', icon: Users },
      ],
    },
    {
      title: 'Guides & Aid',
      items: [
        { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
        { name: 'Admissions Guides', href: '/resources', icon: BookOpen },
        { name: 'Success Stories', href: '/success-stories', icon: Star },
      ],
    },
  ];

  const sections = isTutor ? tutorSections : isParent ? parentSections : studentSections;

  return (
    <aside
      className={`hidden md:flex flex-col h-screen bg-[#0B2A5B] text-white border-r border-[#1E4D9B]/40 transition-all duration-300 relative z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-white text-[#0B2A5B] border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-100 transition-transform hover:scale-110 z-40"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header */}
      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6 gap-3'} border-b border-white/10 flex-shrink-0`}>
        <div className="relative w-10 h-10 flex-shrink-0">
          <Image
            src="/brand/icon-light.svg"
            alt="Eagle Pathway"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            priority
          />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-lg tracking-tight text-white leading-none">
              Eagle Pathway
            </span>
            <span className="text-[11px] text-[#C9A84C] font-semibold tracking-wider uppercase mt-1">
              {isTutor ? 'Tutor Portal' : isParent ? 'Parent Portal' : 'Student Portal'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className={`flex-1 py-4 ${isCollapsed ? 'px-2' : 'px-3'} space-y-4 overflow-y-auto`}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-3 mb-1.5">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] font-bold shadow-md'
                      : item.highlight
                      ? 'bg-white/10 text-white hover:bg-white/15'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon
                    size={17}
                    className={`flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#0B2A5B]' : item.highlight ? 'text-[#C9A84C]' : 'text-white/70'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive
                          ? 'bg-[#0B2A5B] text-white'
                          : 'bg-[#C9A84C] text-[#0B2A5B]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Global Chat Link */}
        <div className="pt-2 border-t border-white/10 space-y-1">
          <Link
            href="/chat"
            title={isCollapsed ? 'Messages' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
              pathname === '/chat'
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] font-bold shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MessageSquare size={17} className={pathname === '/chat' ? 'text-[#0B2A5B]' : 'text-white/70'} />
            {!isCollapsed && <span className="truncate flex-1">Messages</span>}
            {unreadMessages > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Link>

          <Link
            href="/settings"
            title={isCollapsed ? 'Settings' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
              pathname === '/settings'
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] font-bold shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings size={17} className={pathname === '/settings' ? 'text-[#0B2A5B]' : 'text-white/70'} />
            {!isCollapsed && <span className="truncate flex-1">Settings</span>}
          </Link>

          <a
            href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
            target="_blank"
            rel="noopener noreferrer"
            title={isCollapsed ? 'Get Android App' : undefined}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-white/10 hover:text-emerald-300 transition-all group"
          >
            <Smartphone size={17} className="text-emerald-400" />
            {!isCollapsed && <span className="truncate flex-1 font-bold">Get Android App</span>}
          </a>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/10 bg-[#081F44] flex-shrink-0">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          <Link
            href="/profile"
            className="flex items-center gap-2.5 overflow-hidden group"
            title={isCollapsed ? user?.full_name || 'Profile' : undefined}
          >
            <div className="w-9 h-9 rounded-full bg-[#1E4D9B] text-[#C9A84C] font-bold text-xs flex items-center justify-center border border-white/20 flex-shrink-0 group-hover:ring-2 group-hover:ring-[#C9A84C] transition-all">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-white truncate group-hover:text-[#C9A84C] transition-colors">
                  {user?.full_name || 'Account'}
                </span>
                <span className="text-[10px] text-white/50 capitalize truncate">
                  {role}
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-lg text-white/60 hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
