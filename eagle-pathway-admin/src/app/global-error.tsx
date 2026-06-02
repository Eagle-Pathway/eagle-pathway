'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { logger } from '@eagle-pathway/shared';
import { initErrorLogging } from '@/lib/errorLog';

// global-error replaces the root layout when the root itself throws, so it must
// render its own <html>/<body>.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    initErrorLogging();
    logger.error('Root global error boundary', error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center font-sans">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900">The app crashed</h2>
        <p className="max-w-md text-sm text-gray-500">
          Something went badly wrong. The error has been logged. Please try reloading.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
