'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Search, Bell, Menu, Sparkles, User, LogOut, ChevronDown } from 'lucide-react';

interface TopBarProps {
  onMobileMenuToggle: () => void;
  unreadNotifications?: number;
}

export default function TopBar({ onMobileMenuToggle, unreadNotifications = 0 }: TopBarProps) {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/scholarships?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const role = user?.role || 'student';

  return (
    <header className="h-20 bg-white border-b border-gray-200/80 sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-gray-600 hover:text-[#0B2A5B] hover:bg-gray-100 rounded-lg"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <form onSubmit={handleSearch} className="relative w-full">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scholarships, tutors, countries, subjects..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
          />
        </form>
      </div>

      {/* Right: Quick Actions, Notifications & Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Quick Action Pill */}
        {role === 'tutor' ? (
          <Link
            href="/tutor-jobs"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B2A5B] text-white text-xs font-semibold hover:bg-[#1E4D9B] transition-colors shadow-sm"
          >
            <span>Browse Student Requests</span>
          </Link>
        ) : (
          <Link
            href="/tutors"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs font-bold hover:brightness-105 transition-all shadow-sm"
          >
            <Sparkles size={14} />
            <span>Book a Tutor</span>
          </Link>
        )}

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2.5 rounded-xl text-gray-600 hover:text-[#0B2A5B] hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell size={20} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#0B2A5B] text-[#C9A84C] font-bold text-sm flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                (user?.full_name || 'EP')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-900 leading-tight">
                {user?.full_name || 'Eagle Scholar'}
              </span>
              <span className="text-[10px] text-gray-500 capitalize">
                {user?.role || 'Student'}
              </span>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user?.full_name || 'Eagle Scholar'}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                <User size={15} className="text-gray-500" />
                <span>My Profile &amp; Settings</span>
              </Link>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors text-left"
              >
                <LogOut size={15} className="text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

