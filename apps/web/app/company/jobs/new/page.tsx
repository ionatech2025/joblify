import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { PostJobForm } from './post-job-form';

export const metadata = { title: 'Post a job' };

export default async function PostJobPage() {
  const user = await requireRole('COMPANY');
  const profile = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/company/setup');

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Post a job</h1>
      <p style={{ color: '#666' }}>
        Fill in the basics; AI extracts required skills automatically on save.
      </p>
      <PostJobForm />
    </main>
  );
}
