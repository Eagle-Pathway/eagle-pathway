'use client';

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
  X,
  LogOut,
  User as UserIcon,
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
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  unreadMessages?: number;
}

export default function MobileNav({ isOpen, onClose, unreadMessages = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  if (!isOpen) return null;

  const role = (user?.role || 'student').toLowerCase();
  const isTutor = role === 'tutor';
  const isParent = role === 'parent';

  const studentItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
    { name: 'Find Tutors', href: '/tutors', icon: Users },
    { name: 'Request Tutor', href: '/request-tutor', icon: Sparkles },
    { name: 'Applications Tracker', href: '/tracker', icon: Briefcase },
    { name: 'Tutoring Sessions', href: '/bookings', icon: Calendar },
    { name: 'Eagle AI Assistant', href: '/assistant', icon: Sparkles, highlight: true },
    { name: 'AI SOP Reviewer', href: '/tools/sop', icon: Award },
    { name: 'Mock Interview', href: '/tools/interview', icon: Award },
    { name: 'Magic Draft', href: '/tools/magic-draft', icon: Wand2 },
    { name: 'Study Resources', href: '/resources', icon: BookOpen },
    { name: 'Success Stories', href: '/success-stories', icon: Star },
    { name: 'Document Vault', href: '/documents', icon: FolderOpen },
    { name: 'Services & Packages', href: '/services', icon: FileCheck },
  ];

  const tutorItems: NavItem[] = [
    { name: 'Tutor Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tutoring Jobs', href: '/tutor-jobs', icon: ClipboardList, badge: 'Live' },
    { name: 'My Sessions', href: '/bookings', icon: Calendar },
    { name: 'Earnings & Payouts', href: '/earnings', icon: Wallet, highlight: true },
    { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
    { name: 'Teaching Materials', href: '/resources', icon: BookOpen },
    { name: 'Eagle AI Assistant', href: '/assistant', icon: Sparkles },
  ];

  const parentItems: NavItem[] = [
    { name: 'Parent Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Children', href: '/parent/children', icon: Users, badge: 'Track' },
    { name: 'Book a Tutor', href: '/request-tutor', icon: Sparkles, highlight: true },
    { name: 'Children Sessions', href: '/bookings', icon: Calendar },
    { name: 'Find Tutors', href: '/tutors', icon: Users },
    { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
    { name: 'Admissions Guides', href: '/resources', icon: BookOpen },
  ];

  const navItems = isTutor ? tutorItems : isParent ? parentItems : studentItems;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[85%] bg-[#0B2A5B] text-white h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/icon-light.svg"
              alt="Eagle Pathway"
              width={34}
              height={34}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white">Eagle Pathway</span>
              <span className="text-[10px] text-[#C9A84C] font-semibold uppercase">
                {isTutor ? 'Tutor Portal' : isParent ? 'Parent Portal' : 'Student Portal'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] font-bold shadow-md'
                    : item.highlight
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? 'text-[#0B2A5B]' : item.highlight ? 'text-[#C9A84C]' : 'text-white/70'}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#C9A84C] text-[#0B2A5B] uppercase">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-white/10 space-y-1">
            <Link
              href="/chat"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              <MessageSquare size={18} className="text-white/70" />
              <span className="flex-1">Messages</span>
              {unreadMessages > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Link>

            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              <Settings size={18} className="text-white/70" />
              <span>Settings</span>
            </Link>

            <a
              href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-400 hover:bg-white/10"
            >
              <Smartphone size={18} className="text-emerald-400" />
              <span>Get Android App</span>
            </a>

            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              <UserIcon size={18} className="text-white/70" />
              <span>My Profile</span>
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#081F44] flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#1E4D9B] text-[#C9A84C] font-bold text-xs flex items-center justify-center">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-medium text-white truncate max-w-[120px]">
              {user?.full_name || 'Account'}
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              signOut();
            }}
            className="p-2 text-white/70 hover:text-red-400"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
