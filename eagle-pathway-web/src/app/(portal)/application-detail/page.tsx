'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ApplicationDetailRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tracker');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      <p className="text-xs text-slate-500">Redirecting to application tracker...</p>
    </div>
  );
}

export default function ApplicationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          <p className="text-xs text-slate-500">Loading tracker...</p>
        </div>
      }
    >
      <ApplicationDetailRedirect />
    </Suspense>
  );
}

