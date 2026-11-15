'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ScholarshipDetailRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scholarshipId = searchParams.get('id') || searchParams.get('scholarshipId');

  useEffect(() => {
    if (scholarshipId) {
      router.replace(`/scholarships/${encodeURIComponent(scholarshipId)}`);
    } else {
      router.replace('/scholarships');
    }
  }, [router, scholarshipId]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      <p className="text-xs text-slate-500">Redirecting to scholarship opportunity...</p>
    </div>
  );
}

export default function ScholarshipDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          <p className="text-xs text-slate-500">Loading opportunity...</p>
        </div>
      }
    >
      <ScholarshipDetailRedirect />
    </Suspense>
  );
}

