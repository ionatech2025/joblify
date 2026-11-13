'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { reportClientError } from '@/lib/observability/sentry-client';
import { Button, buttonClasses } from '@/app/components/ui/button';
import { ConsoleBody } from './shell';

/**
 * Body of every console segment's error.tsx. Rendering it at the segment, not
 * only at the root, keeps the console register and the module nav around a
 * failed page, so the person can still move to another section.
 */
export function ConsoleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <main>
      <ConsoleBody>
        <div className="o-sheet mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-12 text-center">
          <AlertTriangle aria-hidden className="text-danger size-6" />
          <h1 className="text-fg m-0 text-base font-semibold">Something went wrong</h1>
          <p className="text-fg-muted m-0 max-w-sm text-sm">
            This page hit an unexpected error. Try again, or go to your dashboard.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button onClick={retry}>Try again</Button>
            {/* A full page load, not <Link>: /dashboard redirects back to the
                module home, and Next only clears this boundary when a client
                navigation ends on a different pathname. */}
            <a href="/dashboard" className={`${buttonClasses('secondary')} no-underline`}>
              Go to dashboard
            </a>
          </div>
        </div>
      </ConsoleBody>
    </main>
  );
}
