import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { DeleteForm } from './delete-form';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { FormSheet, SheetTitle } from '@/app/components/console/sheet';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Delete my account' };

export default async function DeleteAccountPage() {
  const user = await requireUser();
  return (
    <main>
      <ControlPanel
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Account', href: '/dashboard' }, { label: 'Delete account' }]}
          />
        }
        actions={
          <Link
            href="/account/export"
            className={`${buttonClasses('secondary', 'sm')} no-underline`}
          >
            Export my data first
          </Link>
        }
      />
      <ConsoleWidth className="max-w-3xl py-3">
        <FormSheet>
          <SheetTitle
            title="Delete your account"
            subtitle="Permanently close your account and schedule all personal data for erasure."
          />
          <p className="text-fg text-[13px] leading-relaxed">
            Deleting your account soft-deletes it now and permanently purges all personal data after
            30 days. Audit-log records that don&apos;t contain personal data are retained for
            legal/anti-fraud purposes.
          </p>
          <p className="text-danger bg-danger-subtle border-danger/25 rounded-control mt-3 border px-3 py-2 text-[13px] font-semibold">
            This cannot be undone after the 30-day window.
          </p>
          <DeleteForm expectedConfirmation={user.email} />
        </FormSheet>
      </ConsoleWidth>
    </main>
  );
}
