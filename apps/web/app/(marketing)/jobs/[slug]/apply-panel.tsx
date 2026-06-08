import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Dynamic island inside the cached JD page. Reads session, shows the right CTA.
export async function ApplyPanel({ jobId, slug }: { jobId: string; slug: string }) {
  const user = await currentUser();

  if (!user) {
    return (
      <>
        <h3 style={{ margin: '0 0 0.5rem' }}>Apply for this role</h3>
        <p style={{ margin: '0 0 1rem', color: '#555' }}>Sign in to apply with your saved resume.</p>
        <Link
          href={`/sign-in?redirect_url=/jobs/${slug}/apply`}
          style={{ padding: '0.75rem 1.25rem', background: '#111', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
        >
          Sign in to apply
        </Link>
      </>
    );
  }

  if (user.userType !== 'JOB_SEEKER') {
    return <p style={{ margin: 0, color: '#555' }}>Only jobseekers can apply to job posts.</p>;
  }

  const existing = await db.jobApplication.findUnique({
    where: { jobPostId_jobSeekerId: { jobPostId: jobId, jobSeekerId: user.id } },
    select: { status: true, appliedAt: true },
  });

  if (existing) {
    return (
      <>
        <h3 style={{ margin: '0 0 0.5rem' }}>You applied already</h3>
        <p style={{ margin: 0, color: '#555' }}>
          Status: <strong>{existing.status}</strong> · applied {existing.appliedAt.toLocaleDateString()}
        </p>
      </>
    );
  }

  return (
    <>
      <h3 style={{ margin: '0 0 0.5rem' }}>Apply for this role</h3>
      <Link
        href={`/jobs/${slug}/apply`}
        style={{ padding: '0.75rem 1.25rem', background: '#111', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
      >
        Start application
      </Link>
    </>
  );
}
