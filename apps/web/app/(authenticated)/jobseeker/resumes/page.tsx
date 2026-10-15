import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ResumeManager } from './resume-manager';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'My resumes' };

export default async function ResumesPage() {
  const user = await requireRole('JOB_SEEKER');
  const rows = await db.resume.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      parsedJson: true,
      parseFailedAt: true,
      createdAt: true,
    },
  });
  const resumes = rows.map((r) => ({
    id: r.id,
    title: r.title,
    parsed: r.parsedJson != null,
    parseFailed: r.parseFailedAt != null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Resumes' }]} />}
        actions={
          <Link
            href="/jobseeker/resumes/builder"
            className={`${buttonClasses('secondary', 'sm')} no-underline`}
          >
            Build from profile
          </Link>
        }
      />
      <ConsoleWidth className="max-w-5xl py-3">
        <p className="text-fg-muted mb-2 text-[13px]">
          Upload a PDF or Word (.docx) resume. We parse it to autofill applications and score your
          matches.
        </p>
        <p className="m-0 text-sm text-fg-muted">
          Don't have a resume file handy?{' '}
          <Link href="/jobseeker/resumes/builder" className="text-brand underline">
            Build one from your profile
          </Link>
          .
        </p>
        <ResumeManager userId={user.id} initialResumes={resumes} />
      </ConsoleWidth>
    </main>
  );
}
