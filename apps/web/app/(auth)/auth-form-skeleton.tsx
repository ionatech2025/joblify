import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * Stand-in for the Clerk <SignIn>/<SignUp> card while its client bundle
 * loads — used as the Suspense fallback on both auth pages so neither shows
 * a blank flash. One shared component (same reasoning as
 * jobs/[slug]/job-detail-skeleton.tsx) keeps the two pages' loading shapes
 * from drifting apart.
 */
export function AuthFormSkeleton() {
  return (
    <div
      aria-hidden
      className="border-border bg-surface rounded-card w-full max-w-sm border p-6 shadow-soft"
    >
      <Skeleton className="h-6 w-36" />
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="rounded-control h-11 w-full" />
        <Skeleton className="rounded-control h-11 w-full" />
      </div>
      <Skeleton className="rounded-control mt-6 h-10 w-full" />
    </div>
  );
}
