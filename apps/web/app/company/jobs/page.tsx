import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export const metadata = { title: 'My job posts' };

export default async function CompanyJobsPage() {
  const user = await requireRole('COMPANY');
  const jobs = await db.jobPost.findMany({
    where: { companyId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <main style={{ padding: '2rem', maxWidth: 1080, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>My job posts</h1>
        <Link
          href="/company/jobs/new"
          style={{ padding: '0.6rem 1rem', background: '#111', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
        >
          Post a job
        </Link>
      </header>

      {jobs.length === 0 ? (
        <p style={{ color: '#666' }}>
          You haven't posted any jobs yet. <Link href="/company/jobs/new">Post your first job</Link>.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Status</th>
              <th style={th}>Applicants</th>
              <th style={th}>Posted</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>
                  <Link href={`/jobs/${j.slug}`}>{j.title}</Link>
                </td>
                <td style={td}>{j.status}</td>
                <td style={td}>
                  <Link href={`/company/applicants/${j.id}`}>{j._count.applications}</Link>
                </td>
                <td style={td}>{(j.publishedAt ?? j.createdAt).toLocaleDateString()}</td>
                <td style={td}>
                  <Link href={`/company/jobs/${j.id}/edit`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd', fontSize: '0.9rem', color: '#555' };
const td: React.CSSProperties = { padding: '0.6rem 0.5rem' };
