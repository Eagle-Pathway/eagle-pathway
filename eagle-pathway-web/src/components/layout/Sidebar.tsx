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
  MessageSquare,
  Sparkles,
  ClipboardList,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Wand2,
  Award,
  BookOpen,
  Star,
  Settings,
  FileCheck,
  Smartphone,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  highlight?: boolean;
  badge?: string;
  badgeColor?: string;
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
      title: 'Menu',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
        { name: 'Find Tutors', href: '/tutors', icon: Users },
        { name: 'Request Tutor', href: '/request-tutor', icon: Sparkles, badge: 'New', badgeColor: 'bg-brand-gold' },
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
        { name: 'Tutoring Jobs', href: '/tutor-jobs', icon: ClipboardList, badge: 'Live', badgeColor: 'bg-emerald-600' },
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
        { name: 'My Children', href: '/parent/children', icon: Users, badge: 'Track', badgeColor: 'bg-brand-blue' },
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
      className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300 relative z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 text-gray-500 z-30 transition-transform hover:scale-110"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Brand Header */}
      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-gray-100 overflow-hidden flex-shrink-0`}>
        {isCollapsed ? (
          <Image
            src="/brand/icon-light.svg"
            alt="Eagle Pathway"
            width={40}
            height={40}
            className="h-10 w-10 flex-shrink-0"
            unoptimized
            priority
          />
        ) : (
          <Image
            src="/brand/logo-light-no-global.svg"
            alt="Eagle Pathway"
            width={180}
            height={48}
            className="h-12 w-auto flex-shrink-0 animate-in fade-in duration-300"
            unoptimized
            priority
          />
        )}
      </div>

      {/* Navigation Sections */}
      <nav className={`flex-1 py-5 ${isCollapsed ? 'px-2' : 'px-4'} space-y-4 overflow-y-auto overflow-x-hidden`}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
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
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-brand-blue/10 text-brand-blue font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                  }`}
                >
                  <Icon
                    className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-brand-blue' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 truncate text-xs animate-in slide-in-from-left-2 duration-300">
                      {item.name}
                    </span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-white text-[10px] font-bold rounded-full shadow-xs ${
                        item.badgeColor || 'bg-brand-blue'
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

        {/* Global Links (Messages, Settings, Mobile App) */}
        <div className="pt-3 border-t border-gray-100 space-y-1">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              Communication & App
            </div>
          )}

          <Link
            href="/chat"
            title={isCollapsed ? 'Messages' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 rounded-xl transition-all duration-200 group relative ${
              pathname === '/chat'
                ? 'bg-brand-blue/10 text-brand-blue font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
            }`}
          >
            <MessageSquare
              className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 ${
                pathname === '/chat' ? 'text-brand-blue' : 'text-gray-400 group-hover:text-gray-600'
              }`}
            />
            {!isCollapsed && <span className="flex-1 truncate text-xs">Messages</span>}
            {unreadMessages > 0 && (
              <span
                className={`${
                  isCollapsed ? 'absolute top-1 right-1' : 'ml-2'
                } px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-xs`}
              >
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Link>

          <Link
            href="/settings"
            title={isCollapsed ? 'Settings' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 rounded-xl transition-all duration-200 group relative ${
              pathname === '/settings'
                ? 'bg-brand-blue/10 text-brand-blue font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
            }`}
          >
            <Settings
              className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 ${
                pathname === '/settings' ? 'text-brand-blue' : 'text-gray-400 group-hover:text-gray-600'
              }`}
            />
            {!isCollapsed && <span className="flex-1 truncate text-xs">Settings</span>}
          </Link>

          <a
            href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
            target="_blank"
            rel="noopener noreferrer"
            title={isCollapsed ? 'Get Android App' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors font-medium group`}
          >
            <Smartphone className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 text-emerald-600`} />
            {!isCollapsed && <span className="flex-1 truncate text-xs font-semibold">Get Android App</span>}
          </a>
        </div>
      </nav>

      {/* User Footer matching Admin Sidebar exactly */}
      <div className="p-4 border-t border-gray-100 overflow-hidden flex-shrink-0">
        <Link
          href="/profile"
          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-2'} py-2 mb-2 rounded-xl hover:bg-gray-50 transition-colors group`}
        >
          <div className="h-8 w-8 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-gold text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex-1 min-w-0 animate-in fade-in duration-300">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || user?.email}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {isTutor ? 'Verified Tutor' : isParent ? 'Guardian / Parent' : 'Scholar Student'}
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={() => signOut()}
          title={isCollapsed ? 'Log out' : ''}
          className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors`}
        >
          <LogOut className={`${isCollapsed ? '' : 'mr-3'} h-4 w-4 flex-shrink-0`} />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
