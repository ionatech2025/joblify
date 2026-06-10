import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { PostJobForm } from './post-job-form';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Post a job' };

export default async function PostJobPage() {
  const user = await requireRole('COMPANY');
  const profile = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/employer-setup');

  return (
    <main>
      <PageHeader
        title="Post a job"
        subtitle="Fill in the basics; AI extracts required skills automatically on save."
        width="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <PostJobForm />
      </div>
    </main>
  );
}
