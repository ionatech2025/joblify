import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';


export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ just_posted?: string }>;
}) {
  const user = await requireRole('COMPANY');
  const { id } = await params;
  const sp = await searchParams;

  const job = await db.jobPost.findFirst({
    where: { id, companyId: user.id, deletedAt: null },
  });
  if (!job) notFound();

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Edit: {job.title}</h1>
      {sp.just_posted && (
        <div style={{ padding: '0.75rem 1rem', background: '#e7f6ec', borderRadius: 8, marginBottom: '1rem' }}>
          Job posted — it's live on /jobs and indexed within a minute.
        </div>
      )}
      <p style={{ color: '#666' }}>
        Inline editor lands as a stretch item in Week 7. For now, status changes happen below.
      </p>

      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ fontSize: '1.1rem' }}>Status: {job.status}</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          To unpublish, change status to CLOSED. Use the API endpoint or the inline editor (coming).
        </p>
      </div>
    </main>
  );
}
