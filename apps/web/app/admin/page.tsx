import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/app/components/ui/ambient';
import { Card } from '@/app/components/ui/card';
import { Container } from '@/app/components/ui/container';
import { Stat, StatRow } from '@/app/components/ui/stat';
import { VerificationQueue } from './verification-queue';

export const metadata = { title: 'Admin' };

export default async function AdminPage() {
  await requireRole('ADMIN');

  const [pending, jobSeekerCount, companyCount, publishedJobCount] = await Promise.all([
    db.companyProfile.findMany({
      where: { verificationStatus: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        companyName: true,
        industry: true,
        companySize: true,
        website: true,
        createdAt: true,
      },
    }),
    db.user.count({ where: { userType: 'JOB_SEEKER', deletedAt: null } }),
    db.user.count({ where: { userType: 'COMPANY', deletedAt: null } }),
    db.jobPost.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
  ]);

  return (
    <main>
      <PageHeader
        eyebrow="Operations"
        title="Admin"
        subtitle="Trust &amp; safety and platform overview."
        width="max-w-4xl"
      />
      <Container className="max-w-4xl py-8">
        <Card className="mb-8 p-6">
          <StatRow>
            <Stat value={jobSeekerCount.toLocaleString()} label="Jobseekers" />
            <Stat value={companyCount.toLocaleString()} label="Companies" />
            <Stat value={publishedJobCount.toLocaleString()} label="Published jobs" />
          </StatRow>
        </Card>

        <h2 className="text-lg font-semibold text-neutral-900">Company verification queue</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Unverified companies don&apos;t appear in the public directory or job search. Review and
          decide below.
        </p>
        <VerificationQueue
          initial={pending.map((p) => ({
            id: p.id,
            companyName: p.companyName,
            industry: p.industry,
            companySize: p.companySize,
            website: p.website,
            createdAt: p.createdAt.toISOString(),
          }))}
        />
      </Container>
    </main>
  );
}
