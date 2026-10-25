import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatThreadLive } from '@/app/components/chat/chat-thread-live';
import { ChatComposer } from '@/app/components/chat/chat-composer';
import { LATEST_MESSAGES_TAKE, toChatMessages } from '@/app/components/chat/latest-messages';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { Badge } from '@/app/components/ui/badge';

export const metadata = { title: 'Chat' };

type Params = Promise<{ id: string }>;

// Seeker view of a chat area. Access = membership; sendChatMessage re-checks
// on every post.
export default async function JobseekerChatAreaPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireRole('JOB_SEEKER');

  const membership = await db.chatParticipant.findUnique({
    where: { chatAreaId_userId: { chatAreaId: id, userId: user.id } },
    include: {
      chatArea: {
        include: {
          company: { select: { companyProfile: { select: { companyName: true, slug: true } } } },
          jobPost: { select: { title: true, slug: true } },
          // Newest window of the thread; toThreadDisplay flips it back to
          // chronological order below.
          messages: {
            orderBy: { createdAt: 'desc' },
            take: LATEST_MESSAGES_TAKE,
            include: { sender: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      },
    },
  });
  if (!membership) notFound();

  const area = membership.chatArea;
  const companyName = area.company.companyProfile?.companyName ?? 'Company';
  const companySlug = area.company.companyProfile?.slug ?? null;
  // The company account may have no first/last name; its messages should read
  // as the company rather than as a blank sender. Another candidate with no
  // name is "Participant" — never their e-mail (must match the polled route).
  const initial = toChatMessages(area.messages, (m) =>
    m.senderId === area.companyId ? companyName : 'Participant',
  );

  return (
    <main>
      {/* The "All chats" back-link is gone — the breadcrumb's first crumb is
          that link. */}
      <ControlPanel
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Chats', href: '/jobseeker/chats' }, { label: area.title }]}
          />
        }
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="lg:col-span-2">
          <p className="text-fg-muted text-[13px]">
            {companyName}
            {area.jobPost ? (
              <>
                {' · about the '}
                <Link href={`/jobs/${area.jobPost.slug}`} className="text-brand underline">
                  {area.jobPost.title}
                </Link>
                {' role.'}
              </>
            ) : (
              ' · virtual-intern chat area.'
            )}
          </p>
        </section>

        <section>
          <ChatThreadLive chatAreaId={area.id} currentUserId={user.id} initial={initial} />
          <ChatComposer chatAreaId={area.id} />
        </section>

        <aside className="o-sheet flex flex-col gap-4 p-3.5">
          <div>
            <h2 className="border-border text-fg-muted mb-2 border-b pb-1.5 text-[12px] font-semibold tracking-wider uppercase">
              Room details
            </h2>
            <dl className="m-0 flex flex-col gap-2 text-[13px]">
              <div>
                <dt className="text-fg-subtle text-[12px]">Company</dt>
                <dd className="text-fg m-0 font-medium">
                  {companySlug ? (
                    <Link
                      href={`/companies/${companySlug}`}
                      className="text-brand no-underline hover:underline"
                    >
                      {companyName}
                    </Link>
                  ) : (
                    companyName
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-fg-subtle text-[12px]">Context</dt>
                <dd className="m-0 mt-0.5">
                  {area.jobPost ? (
                    <Link
                      href={`/jobs/${area.jobPost.slug}`}
                      className="text-brand text-[13px] no-underline hover:underline"
                    >
                      {area.jobPost.title}
                    </Link>
                  ) : (
                    <Badge tone="neutral">Virtual interns</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-control border-border bg-surface-sunken/70 border p-2.5">
            <p className="text-fg flex items-center gap-1.5 text-[12px] font-semibold">
              <ShieldCheck aria-hidden className="text-brand size-3.5 shrink-0" />
              Trust &amp; safety
            </p>
            <p className="text-fg-muted mt-1 text-[12px] leading-snug">
              Verified employers never ask for payment, banking credentials, or off-platform fees
              during hiring.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
