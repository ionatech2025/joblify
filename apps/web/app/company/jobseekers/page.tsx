import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { shareJobFromForm } from '@/app/actions/share-job';
import { addVirtualInternToChat } from '@/app/actions/chat';
import { inviteJobseeker } from '@/app/actions/invitations';
import { PageHeader } from '@/app/components/ui/ambient';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Select } from '@/app/components/ui/form';

export const metadata = { title: 'Job seekers' };

type SearchParams = Promise<{ filter?: string; type?: string }>;

type SeekerRow = {
  userId: string;
  name: string;
  headline: string | null;
  location: string | null;
  profileType: 'EMPLOYABLE' | 'VIRTUAL_INTERN';
  skills: string[];
  subscribed: boolean;
};

// Directory of job seekers (flowchart: "view job seekers' profiles — those on
// site / those subscribed"). "All" shows PUBLIC profiles; "Subscribed" shows
// this company's subscribers regardless of visibility, since subscribing is an
// explicit opt-in toward the company.
export default async function CompanyJobseekersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireRole('COMPANY');
  const params = await searchParams;
  const filter = params.filter === 'subscribed' ? 'subscribed' : 'all';
  const type =
    params.type === 'EMPLOYABLE' || params.type === 'VIRTUAL_INTERN' ? params.type : undefined;

  const [seekers, publishedJobs] = await Promise.all([
    filter === 'subscribed' ? getSubscribedSeekers(user.id, type) : getPublicSeekers(user.id, type),
    db.jobPost.findMany({
      where: { companyId: user.id, status: 'PUBLISHED', deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true },
    }),
  ]);

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium no-underline transition-colors ${
        active ? 'bg-neutral-900 text-white hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
    >
      {label}
    </Link>
  );

  const qs = (f: string, t?: string) =>
    `/company/jobseekers?filter=${f}${t ? `&type=${t}` : ''}`;

  return (
    <main>
      <PageHeader
        title="Job seekers"
        subtitle="Browse public profiles and your subscribers. Share a job post or bring virtual interns into your chat area."
        width="max-w-5xl"
      />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {tab(qs('all', type), 'On site', filter === 'all')}
          {tab(qs('subscribed', type), 'Subscribed to you', filter === 'subscribed')}
          <span className="mx-2 h-4 w-px bg-neutral-200" aria-hidden />
          {tab(qs(filter), 'All types', !type)}
          {tab(qs(filter, 'EMPLOYABLE'), 'Employable', type === 'EMPLOYABLE')}
          {tab(qs(filter, 'VIRTUAL_INTERN'), 'Virtual interns', type === 'VIRTUAL_INTERN')}
        </div>

        {seekers.length === 0 ? (
          <p className="text-neutral-600">
            {filter === 'subscribed'
              ? 'No one has subscribed to your company yet.'
              : 'No public job seeker profiles match this filter yet.'}
          </p>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-3 p-0">
            {seekers.map((s) => (
              <li key={s.userId} className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 font-semibold text-neutral-900">
                      {s.name}
                      <Badge tone="neutral" className="ml-2">
                        {s.profileType === 'VIRTUAL_INTERN' ? 'Virtual intern' : 'Employable'}
                      </Badge>
                      {s.subscribed && (
                        <Badge tone="brand" className="ml-2">
                          Subscriber
                        </Badge>
                      )}
                    </p>
                    {s.headline && <p className="mt-1 mb-0 text-sm text-neutral-700">{s.headline}</p>}
                    <p className="mt-1 mb-0 text-xs text-neutral-500">
                      {[s.location, s.skills.slice(0, 6).join(', ')].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {publishedJobs.length > 0 && (
                      <form action={shareJobFromForm.bind(null, s.userId)} className="flex items-center gap-2">
                        <Select name="jobPostId" required className="w-48" defaultValue="">
                          <option value="" disabled>
                            Share a job…
                          </option>
                          {publishedJobs.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.title}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" variant="secondary" size="sm">
                          Share
                        </Button>
                      </form>
                    )}
                    {s.profileType === 'VIRTUAL_INTERN' && (
                      <form action={addVirtualInternToChat.bind(null, s.userId)}>
                        <Button type="submit" variant="secondary" size="sm">
                          Add to VI chat
                        </Button>
                      </form>
                    )}
                    {!s.subscribed && (
                      <form action={inviteJobseeker.bind(null, s.userId, s.profileType)}>
                        <Button type="submit" variant="secondary" size="sm">
                          Invite as {s.profileType === 'VIRTUAL_INTERN' ? 'VI' : 'employable'}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

async function getPublicSeekers(
  companyUserId: string,
  type?: 'EMPLOYABLE' | 'VIRTUAL_INTERN',
): Promise<SeekerRow[]> {
  const [profiles, subscriptions] = await Promise.all([
    db.jobSeekerProfile.findMany({
      where: {
        visibility: 'PUBLIC',
        ...(type ? { profileType: type } : {}),
        user: { deletedAt: null, userType: 'JOB_SEEKER' },
      },
      orderBy: { updatedAt: 'desc' },
      take: 60,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        skills: { include: { skill: { select: { label: true } } } },
      },
    }),
    db.companySubscription.findMany({
      where: { companyId: companyUserId },
      select: { jobSeekerId: true },
    }),
  ]);
  const subscribedIds = new Set(subscriptions.map((s) => s.jobSeekerId));

  return profiles.map((p) => ({
    userId: p.user.id,
    name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || 'Job seeker',
    headline: p.headline,
    location: p.location,
    profileType: p.profileType,
    skills: p.skills.map((s) => s.skill.label),
    subscribed: subscribedIds.has(p.user.id),
  }));
}

async function getSubscribedSeekers(
  companyUserId: string,
  type?: 'EMPLOYABLE' | 'VIRTUAL_INTERN',
): Promise<SeekerRow[]> {
  const subscriptions = await db.companySubscription.findMany({
    where: { companyId: companyUserId, ...(type ? { profileType: type } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 60,
    include: {
      jobSeeker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          deletedAt: true,
          jobSeekerProfile: {
            include: { skills: { include: { skill: { select: { label: true } } } } },
          },
        },
      },
    },
  });

  return subscriptions
    .filter((s) => !s.jobSeeker.deletedAt)
    .map((s) => ({
      userId: s.jobSeeker.id,
      name: [s.jobSeeker.firstName, s.jobSeeker.lastName].filter(Boolean).join(' ') || 'Job seeker',
      headline: s.jobSeeker.jobSeekerProfile?.headline ?? null,
      location: s.jobSeeker.jobSeekerProfile?.location ?? null,
      profileType: s.profileType,
      skills: s.jobSeeker.jobSeekerProfile?.skills.map((x) => x.skill.label) ?? [],
      subscribed: true,
    }));
}
