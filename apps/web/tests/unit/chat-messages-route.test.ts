import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ChatMessageKind } from '@prisma/client';
import { toChatMessages, LATEST_MESSAGES_TAKE } from '@/app/components/chat/latest-messages';

// The polled read behind an open chat thread. Access is membership, re-derived
// server-side on every poll rather than trusted from the client — the same rule
// sendChatMessage applies on every post.

const m = vi.hoisted(() => ({
  currentUser: vi.fn(),
  areaFindFirst: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ currentUser: m.currentUser }));
vi.mock('@/lib/db', () => ({ db: { chatArea: { findFirst: m.areaFindFirst } } }));

const { GET } = await import('@/app/api/v1/chats/[id]/messages/route');

const params = Promise.resolve({ id: 'area1' });

type Row = {
  id: string;
  senderId: string;
  kind: ChatMessageKind;
  body: string;
  attachmentUrl: string | null;
  createdAt: Date;
  sender: { firstName: string | null; lastName: string | null; email: string };
};

function row(over: Partial<Row> = {}): Row {
  return {
    id: 'msg1',
    senderId: 'company1',
    kind: 'TEXT',
    body: 'hello',
    attachmentUrl: null,
    createdAt: new Date('2026-03-09T10:00:00.000Z'),
    sender: { firstName: null, lastName: null, email: 'recruiter@acme.test' },
    ...over,
  };
}

const AREA = {
  companyId: 'company1',
  company: { companyProfile: { companyName: 'Acme Inc.' } },
  messages: [row()],
};

beforeEach(() => {
  vi.clearAllMocks();
  m.currentUser.mockResolvedValue({ id: 'seeker1' });
  m.areaFindFirst.mockResolvedValue(AREA);
});

describe('GET /api/v1/chats/[id]/messages', () => {
  it('401s an unauthenticated request without touching the database', async () => {
    m.currentUser.mockResolvedValue(null);
    const res = await GET(new Request('http://t/'), { params });
    expect(res.status).toBe(401);
    expect(m.areaFindFirst).not.toHaveBeenCalled();
  });

  it('scopes the lookup to the company owner OR a participant', async () => {
    await GET(new Request('http://t/'), { params });
    const where = m.areaFindFirst.mock.calls[0]![0].where;
    expect(where.id).toBe('area1');
    expect(where.OR).toEqual([
      { companyId: 'seeker1' },
      { participants: { some: { userId: 'seeker1' } } },
    ]);
  });

  // 404 rather than 403: a non-member must not be able to learn which chat
  // area ids exist.
  it('404s a non-member rather than 403ing', async () => {
    m.areaFindFirst.mockResolvedValue(null);
    const res = await GET(new Request('http://t/'), { params });
    expect(res.status).toBe(404);
  });

  it('never lets a shared cache hold per-user content', async () => {
    const res = await GET(new Request('http://t/'), { params });
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('reads only the newest window, newest-first', async () => {
    await GET(new Request('http://t/'), { params });
    const messages = m.areaFindFirst.mock.calls[0]![0].select.messages;
    expect(messages.take).toBe(LATEST_MESSAGES_TAKE);
    expect(messages.orderBy).toEqual({ createdAt: 'desc' });
  });

  it("names the company's own unnamed messages after the company", async () => {
    const res = await GET(new Request('http://t/'), { params });
    const body = await res.json();
    expect(body.messages[0].senderName).toBe('Acme Inc.');
  });

  it('falls back to the address for anyone who is not the company', async () => {
    m.areaFindFirst.mockResolvedValue({
      ...AREA,
      messages: [
        row({
          senderId: 'seeker1',
          sender: { firstName: null, lastName: null, email: 'ada@x.test' },
        }),
      ],
    });
    const res = await GET(new Request('http://t/'), { params });
    const body = await res.json();
    expect(body.messages[0].senderName).toBe('ada@x.test');
  });

  it('prefers a real name over either fallback', async () => {
    m.areaFindFirst.mockResolvedValue({
      ...AREA,
      messages: [row({ sender: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.test' } })],
    });
    const res = await GET(new Request('http://t/'), { params });
    const body = await res.json();
    expect(body.messages[0].senderName).toBe('Ada Lovelace');
  });
});

describe('toChatMessages', () => {
  const newestFirst = [
    row({ id: 'c', createdAt: new Date('2026-03-09T12:00:00.000Z') }),
    row({ id: 'b', createdAt: new Date('2026-03-09T11:00:00.000Z') }),
    row({ id: 'a', createdAt: new Date('2026-03-09T10:00:00.000Z') }),
  ];

  it('flips a newest-first window back into reading order', () => {
    const { messages } = toChatMessages(newestFirst, () => 'x');
    expect(messages.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  // The page render and the poll must produce byte-identical objects, and a
  // Date does not survive JSON.
  it('serialises createdAt as an ISO string', () => {
    const { messages } = toChatMessages(newestFirst, () => 'x');
    expect(messages[0]!.createdAt).toBe('2026-03-09T10:00:00.000Z');
  });

  it('flags truncation only on an exactly-full window', () => {
    expect(toChatMessages(newestFirst, () => 'x').truncated).toBe(false);
    const full = Array.from({ length: LATEST_MESSAGES_TAKE }, (_, i) => row({ id: String(i) }));
    expect(toChatMessages(full, () => 'x').truncated).toBe(true);
  });

  it('lets the caller decide the fallback name per surface', () => {
    const asCompany = toChatMessages([row()], () => 'Acme Inc.').messages[0]!.senderName;
    const asRecruiter = toChatMessages([row()], (x) => x.sender.email).messages[0]!.senderName;
    expect(asCompany).toBe('Acme Inc.');
    expect(asRecruiter).toBe('recruiter@acme.test');
  });
});
