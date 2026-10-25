import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { EmployerSetupForm } from './employer-setup-form';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { FormSheet } from '@/app/components/console/sheet';
import { Badge } from '@/app/components/ui/badge';
import { buttonClasses } from '@/app/components/ui/button';
import { Building2, Clock } from 'lucide-react';

export const metadata = { title: 'Set up your company' };

export default async function EmployerSetupPage() {
  const user = await requireUser();
  const [existing, jobSeekerProfile] = await Promise.all([
    db.companyProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, companyName: true, verificationStatus: true },
    }),
    db.jobSeekerProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ]);

  if (existing?.verificationStatus === 'VERIFIED') {
    redirect('/company/jobs');
  }

  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Company setup' }]} />} />
      <ConsoleWidth className="max-w-5xl py-3">
        {existing?.verificationStatus === 'PENDING' ? (
          <FormSheet className="py-8 text-center">
            <div className="bg-warn-subtle text-warn mx-auto mb-3 flex size-11 items-center justify-center rounded-full">
              <Clock aria-hidden className="size-5" />
            </div>
            <Badge tone="warn" className="mb-2">
              In review
            </Badge>
            <h2 className="text-fg m-0 text-base font-semibold">Account Pending Verification</h2>
            <p className="text-fg-muted mx-auto mt-2 max-w-md text-[13px] leading-relaxed">
              <strong>{existing.companyName}</strong> has been submitted. An administrator is
              reviewing your company details. You will receive full access to post jobs and review
              applicants once approved.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/jobs" className={`${buttonClasses('secondary', 'sm')} no-underline`}>
                Browse public jobs
              </Link>
              <Link href="/companies" className={`${buttonClasses('ghost', 'sm')} no-underline`}>
                View company directory
              </Link>
            </div>
          </FormSheet>
        ) : existing?.verificationStatus === 'REJECTED' ? (
          <FormSheet className="border-danger/30 bg-danger-subtle py-8 text-center">
            <div className="bg-danger/10 text-danger mx-auto mb-3 flex size-11 items-center justify-center rounded-full">
              <Building2 aria-hidden className="size-5" />
            </div>
            <Badge tone="danger" className="mb-2">
              Action required
            </Badge>
            <h2 className="text-fg m-0 text-base font-semibold">Verification Unsuccessful</h2>
            <p className="text-fg-muted mx-auto mt-2 max-w-md text-[13px] leading-relaxed">
              Your company verification could not be completed. Please contact support if you
              believe this was an error.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/about" className={`${buttonClasses('secondary', 'sm')} no-underline`}>
                About Joblify
              </Link>
            </div>
          </FormSheet>
        ) : (
          <EmployerSetupForm hasJobSeekerIdentity={Boolean(jobSeekerProfile)} />
        )}
      </ConsoleWidth>
    </main>
  );
}
