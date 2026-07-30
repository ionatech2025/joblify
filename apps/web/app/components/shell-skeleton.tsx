import type { ReactNode } from 'react';
import { Container } from './ui/container';
import { SkeletonPillNav } from './ui/skeleton';

/**
 * Dashboard shell fallback: a sub-nav strip of pill placeholders above the
 * page-level skeleton.
 *
 * While a layout's auth/role gate resolves, the children — including whatever
 * sub-nav they render — are still pending, so the strip has to be reserved here
 * or the nav pops in and shifts the page. Shared by the jobseeker, company and
 * admin shells, which each had a byte-identical private copy.
 */
export function ShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <section>
      <div className="glass border-border border-b">
        <Container className="py-2.5">
          <SkeletonPillNav />
        </Container>
      </div>
      {children}
    </section>
  );
}
