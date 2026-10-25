import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ConsoleShell } from '@/app/components/console/shell';
import { ConsoleNavSkeleton } from '@/app/components/console/skeleton';
import { CompanyConsoleNav } from './company-console-nav';

// The role check is a SIBLING of children, and this component is not async.
// An async layout has no Suspense boundary of its own — loading.tsx wraps a
// layout's *children*, not the layout — which is why the await has to move into
// an island instead of being awaited here.
export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell>
      <Suspense fallback={null}>
        <RoleGate />
      </Suspense>
      <Suspense fallback={<ConsoleNavSkeleton />}>
        <CompanyConsoleNav />
      </Suspense>
      {children}
    </ConsoleShell>
  );
}

// Renders nothing; exists for the redirect. A signed-in user who isn't a
// verified company yet is sent to /employer-setup to create their profile or wait for verification.
async function RoleGate() {
  const user = await requireUser();
  if (user.userType !== 'COMPANY') redirect('/employer-setup');
  const profile = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });
  if (!profile || profile.verificationStatus !== 'VERIFIED') {
    redirect('/employer-setup?verification=pending');
  }
  return null;
}
