import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { EmployerSetupForm } from './employer-setup-form';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
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
      <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-4">
        {existing?.verificationStatus === 'PENDING' ? (
          <div className="rounded-card border border-border bg-surface p-6 shadow-soft text-center mt-6">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-warn/10 text-warn">
              <Clock className="size-6" />
            </div>
            <h2 className="text-lg font-semibold text-fg m-0">Account Pending Verification</h2>
            <p className="mt-2 text-sm text-fg-muted max-w-md mx-auto">
              <strong>{existing.companyName}</strong> has been submitted. An administrator is reviewing your company details.
              You will receive full access to post jobs and review applicants once approved.
            </p>
          </div>
        ) : existing?.verificationStatus === 'REJECTED' ? (
          <div className="rounded-card border border-danger/20 bg-danger-subtle p-6 shadow-soft text-center mt-6">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <Building2 className="size-6" />
            </div>
            <h2 className="text-lg font-semibold text-fg m-0">Verification Unsuccessful</h2>
            <p className="mt-2 text-sm text-fg-muted max-w-md mx-auto">
              Your company verification could not be completed. Please check your notification inbox or contact support.
            </p>
          </div>
        ) : (
          <>
            <p className="text-fg-muted mb-2 text-[13px]">
              Create your company profile to start posting jobs and reviewing applicants.
            </p>
            <EmployerSetupForm hasJobSeekerIdentity={Boolean(jobSeekerProfile)} />
          </>
        )}
      </div>
    </main>
  );
}
