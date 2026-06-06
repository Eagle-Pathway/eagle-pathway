'use client';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/AuthGuard';
import { FeedbackProvider } from '@/components/ui/Feedback';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <FeedbackProvider>
        <div className="flex h-screen bg-gray-50/50 overflow-hidden text-gray-900">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-8 py-8 md:px-12 bg-gray-50/50">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </FeedbackProvider>
    </AuthGuard>
  );
}
