'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Mounts Vercel Analytics + Speed Insights only after the user accepts analytics
// cookies (joblify_consent=all). Reacts to the `joblify:consent` event the cookie
// banner dispatches, so consent takes effect without a reload. Nothing
// analytics-related is requested before consent — the GDPR-safe default.
export function AnalyticsGate() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () =>
      setAllowed(document.cookie.split('; ').includes('joblify_consent=all'));
    check();
    window.addEventListener('joblify:consent', check);
    return () => window.removeEventListener('joblify:consent', check);
  }, []);

  if (!allowed) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
