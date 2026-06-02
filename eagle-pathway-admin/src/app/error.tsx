'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { logger } from '@eagle-pathway/shared';
import { initErrorLogging } from '@/lib/errorLog';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    initErrorLogging();
    logger.error('Route segment error boundary', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
      <p className="max-w-md text-sm text-gray-500">
        We hit an unexpected error loading this page. You can try again — if it keeps happening,
        the issue has been logged for the team.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
