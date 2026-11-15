'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function TutorJobDetailRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tutor-jobs');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      <p className="text-xs text-slate-500">Redirecting to tutoring marketplace...</p>
    </div>
  );
}

export default function TutorJobDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          <p className="text-xs text-slate-500">Loading marketplace...</p>
        </div>
      }
    >
      <TutorJobDetailRedirect />
    </Suspense>
  );
}

