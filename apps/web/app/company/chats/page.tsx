import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { openJobChatArea, openVirtualInternChatArea } from '@/app/actions/chat';
import { PageHeader } from '@/app/components/ui/ambient';
import { Button } from '@/app/components/ui/button';

export const metadata = { title: 'Chat areas' };

// Company chat hub: one area per job (created on demand) plus the single
// virtual-intern area (flowchart: "create job specific chat area" / "create
// virtual intern chat area").
export default async function CompanyChatsPage() {
  const user = await requireRole('COMPANY');

  const [areas, jobsWithoutArea] = await Promise.all([
    db.chatArea.findMany({
      where: { companyId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        jobPost: { select: { title: true } },
        _count: { select: { participants: true, messages: true } },
      },
    }),
    db.jobPost.findMany({
      where: { companyId: user.id, deletedAt: null, chatArea: { is: null } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    }),
  ]);

  const hasViArea = areas.some((a) => a.kind === 'VIRTUAL_INTERN');

  return (
    <main>
      <PageHeader
        title="Chat areas"
        subtitle="Job-specific rooms for shortlisted applicants, plus one room for your virtual interns."
        width="max-w-4xl"
        actions={
          !hasViArea ? (
            <form action={openVirtualInternChatArea}>
              <Button type="submit">Create virtual-intern chat area</Button>
            </form>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {areas.length === 0 ? (
          <p className="text-neutral-600">No chat areas yet. Create one below for a job, or open your virtual-intern area.</p>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-3 p-0">
            {areas.map((a) => (
              <li key={a.id} className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/company/chats/${a.id}`} className="font-semibold text-neutral-900 hover:underline">
                      {a.title}
                    </Link>
                    <p className="mt-1 mb-0 text-xs text-neutral-500">
                      {a.kind === 'VIRTUAL_INTERN' ? 'Virtual interns' : `Job · ${a.jobPost?.title ?? 'deleted job'}`} ·{' '}
                      {a._count.participants} participant{a._count.participants === 1 ? '' : 's'} · {a._count.messages}{' '}
                      message{a._count.messages === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Link href={`/company/chats/${a.id}`} className="text-sm text-indigo-700 hover:underline">
                    Open →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {jobsWithoutArea.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-neutral-900">Jobs without a chat area</h2>
            <ul className="mt-3 grid list-none grid-cols-1 gap-2 p-0">
              {jobsWithoutArea.map((j) => (
                <li
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 shadow-soft"
                >
                  <span className="text-sm font-medium text-neutral-900">{j.title}</span>
                  <form action={openJobChatArea.bind(null, j.id)}>
                    <Button type="submit" variant="secondary" size="sm">
                      Create chat area
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
