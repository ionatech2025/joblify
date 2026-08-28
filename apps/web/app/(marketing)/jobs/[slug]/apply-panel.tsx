import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { buttonClasses } from '@/app/components/ui/button';
import { SaveButton } from './save-button';
import { TimeStamp } from '@/app/components/ui/timestamp';

const primaryLink = `${buttonClasses('primary')} no-underline`;
const heading = 'm-0 mb-2 text-lg font-semibold text-fg';

// Dynamic island inside the cached JD page. Reads session, shows the right CTA.
export async function ApplyPanel({ jobId, slug }: { jobId: string; slug: string }) {
  const user = await currentUser();

  if (!user) {
    return (
      <>
        <h3 className={heading}>Apply for this role</h3>
        <p className="mb-4 text-fg-muted">Sign in to apply with your saved resume.</p>
        <Link href={`/sign-in?redirect_url=/jobs/${slug}/apply`} className={primaryLink}>
          Sign in to apply
        </Link>
      </>
    );
  }

  if (user.userType !== 'JOB_SEEKER') {
    return <p className="m-0 text-fg-muted">Only jobseekers can apply to job posts.</p>;
  }

  const [existing, saved] = await Promise.all([
    db.jobApplication.findUnique({
      where: { jobPostId_jobSeekerId: { jobPostId: jobId, jobSeekerId: user.id } },
      select: { status: true, appliedAt: true },
    }),
    db.savedJob.findUnique({
      where: { userId_jobPostId: { userId: user.id, jobPostId: jobId } },
      select: { id: true },
    }),
  ]);

  return (
    <>
      {existing ? (
        <>
          <h3 className={heading}>You applied already</h3>
          <p className="m-0 text-fg-muted">
            Status: <strong>{existing.status}</strong> · applied{' '}
            <TimeStamp value={existing.appliedAt} />
          </p>
        </>
      ) : (
        <>
          <h3 className={heading}>Apply for this role</h3>
          <Link href={`/jobs/${slug}/apply`} className={primaryLink}>
            Start application
          </Link>
        </>
      )}
      <div className="mt-3">
        <SaveButton jobId={jobId} initialSaved={!!saved} />
      </div>
    </>
  );
}
