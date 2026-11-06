'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Auth Protection Gate
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Operational Unread Badges
  useEffect(() => {
    if (!user?.id) return;

    const fetchBadges = async () => {
      try {
        const [{ count: msgCount }, { count: notifCount }] = await Promise.all([
          supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false),
          supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false),
        ]);
        setUnreadMsgCount(msgCount || 0);
        setUnreadNotifCount(notifCount || 0);
      } catch (e) {
        // Non-blocking fallback
      }
    };

    fetchBadges();

    const channel = supabase
      .channel(`portal-badges-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => fetchBadges())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchBadges())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-brand-blue/20 border-t-brand-blue animate-spin" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            Loading Eagle Pathway...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 text-gray-900">
      {/* Desktop Left Sidebar */}
      <Sidebar unreadMessages={unreadMsgCount} />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        unreadMessages={unreadMsgCount}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          unreadNotifications={unreadNotifCount}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-8 bg-gray-50/50">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

