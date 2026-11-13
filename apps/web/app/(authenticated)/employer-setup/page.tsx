import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { EmployerSetupForm } from './employer-setup-form';
import { CompanySettingsForm } from '@/app/company/settings/company-settings-form';
import { profileFormValues } from '@/app/company/settings/profile-form-values';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { FormSheet } from '@/app/components/console/sheet';
import { Badge } from '@/app/components/ui/badge';
import { buttonClasses } from '@/app/components/ui/button';
import { TimeStamp } from '@/app/components/ui/timestamp';
import { Building2, Clock } from 'lucide-react';

export const metadata = { title: 'Set up your company' };

export default async function EmployerSetupPage() {
  const user = await requireUser();
  const [existing, jobSeekerProfile] = await Promise.all([
    db.companyProfile.findUnique({ where: { userId: user.id } }),
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
          <>
            <FormSheet className="border-danger/30 bg-danger-subtle mb-4 py-6">
              <div className="flex items-start gap-3">
                <div className="bg-danger/10 text-danger flex size-11 shrink-0 items-center justify-center rounded-full">
                  <Building2 aria-hidden className="size-5" />
                </div>
                <div className="min-w-0">
                  <Badge tone="danger" className="mb-2">
                    Action required
                  </Badge>
                  <h2 className="text-fg m-0 text-base font-semibold">Verification Unsuccessful</h2>
                  <p className="text-fg-muted mt-2 max-w-prose text-[13px] leading-relaxed">
                    We reviewed <strong>{existing.companyName}</strong> and could not verify it yet.
                    {existing.reviewedAt ? (
                      <>
                        {' '}
                        Reviewed <TimeStamp value={existing.reviewedAt} />.
                      </>
                    ) : null}
                  </p>
                  {existing.rejectionReason ? (
                    <div className="mt-3 max-w-prose">
                      <h3 className="text-fg m-0 text-[13px] font-semibold">Reason</h3>
                      <p className="text-fg m-0 mt-1 text-[13px] leading-relaxed whitespace-pre-wrap">
                        {existing.rejectionReason}
                      </p>
                    </div>
                  ) : null}
                  <p className="text-fg-muted mt-3 max-w-prose text-[13px] leading-relaxed">
                    Fix your details below and resubmit for review. Please contact support if you
                    believe this was an error.
                  </p>
                  <Link
                    href="/about"
                    className={`${buttonClasses('secondary', 'sm')} mt-1 no-underline`}
                  >
                    About Joblify
                  </Link>
                </div>
              </div>
            </FormSheet>
            <CompanySettingsForm
              logoUrl={existing.logoUrl ?? null}
              verificationStatus={existing.verificationStatus}
              initial={profileFormValues(existing, user.phone)}
            />
          </>
        ) : (
          <EmployerSetupForm hasJobSeekerIdentity={Boolean(jobSeekerProfile)} />
        )}
      </ConsoleWidth>
    </main>
  );
}
