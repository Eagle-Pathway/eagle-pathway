'use client';

import { useEffect } from 'react';
import { initErrorLogging } from '@/lib/errorLog';

/**
 * Mounts once in the root layout to configure the shared logger + Supabase sink
 * on the client. Renders nothing.
 */
export default function ErrorLoggerInit() {
  useEffect(() => {
    initErrorLogging();
  }, []);
  return null;
}
