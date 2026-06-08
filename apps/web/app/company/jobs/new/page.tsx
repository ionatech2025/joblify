import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { PostJobForm } from './post-job-form';

export const metadata = { title: 'Post a job' };

export default async function PostJobPage() {
  const user = await requireRole('COMPANY');
  const profile = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/employer-setup');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Post a job</h1>
      <p className="mt-1 text-neutral-600">
        Fill in the basics; AI extracts required skills automatically on save.
      </p>
      <PostJobForm />
    </main>
  );
}
