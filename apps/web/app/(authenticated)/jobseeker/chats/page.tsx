import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'My chats' };

// Chat areas the seeker belongs to — companies add you when you're
// shortlisted for a job or invited as a virtual intern.
export default async function JobseekerChatsPage() {
  const user = await requireRole('JOB_SEEKER');

  const memberships = await db.chatParticipant.findMany({
    where: { userId: user.id },
    include: {
      chatArea: {
        include: {
          company: { select: { companyProfile: { select: { companyName: true } } } },
          jobPost: { select: { title: true } },
          _count: { select: { messages: true } },
        },
      },
    },
    orderBy: { chatArea: { updatedAt: 'desc' } },
  });

  return (
    <main>
      <PageHeader
        title="My chats"
        subtitle="Companies add you here when you're shortlisted for a job or joined as a virtual intern."
        width="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {memberships.length === 0 ? (
          <p className="text-neutral-600">
            No chats yet. Apply to jobs or subscribe to companies — once a company shortlists or invites you,
            the conversation shows up here.
          </p>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-3 p-0">
            {memberships.map(({ chatArea: a }) => (
              <li key={a.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/jobseeker/chats/${a.id}`} className="font-semibold text-neutral-900 hover:underline">
                      {a.title}
                    </Link>
                    <p className="mt-1 mb-0 text-xs text-neutral-500">
                      {a.company.companyProfile?.companyName ?? 'Company'}
                      {a.jobPost ? ` · ${a.jobPost.title}` : ' · Virtual interns'} · {a._count.messages} message
                      {a._count.messages === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Link href={`/jobseeker/chats/${a.id}`} className="text-sm text-indigo-700 hover:underline">
                    Open →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
