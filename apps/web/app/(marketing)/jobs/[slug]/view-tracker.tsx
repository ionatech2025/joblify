'use client';

import { useEffect } from 'react';

// Fires a one-per-session view beacon for the JD page. Renders nothing; lives
// in the cached PPR shell and runs client-side after hydration.
export function ViewTracker({ jobId }: { jobId: string }) {
  useEffect(() => {
    const key = `viewed:${jobId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage blocked (private mode) — fall through and still track once
    }
    const url = `/api/v1/jobs/${jobId}/view`;
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      void fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  }, [jobId]);

  return null;
}
