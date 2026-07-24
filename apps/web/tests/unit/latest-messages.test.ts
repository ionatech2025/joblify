import { describe, it, expect } from 'vitest';
import { LATEST_MESSAGES_TAKE, toThreadDisplay } from '@/app/components/chat/latest-messages';

// Thread pages fetch the newest window of a chat (`orderBy createdAt desc,
// take 100`) so long threads show recent history instead of the opening
// messages; toThreadDisplay flips that window back into chronological order
// and flags an exactly-full window so the pages can render the
// "Showing the latest 100 messages" truncation note.
describe('toThreadDisplay', () => {
  it('reverses a newest-first window into chronological display order', () => {
    const input = [{ id: 'newest' }, { id: 'middle' }, { id: 'oldest' }];
    const { messages, truncated } = toThreadDisplay(input);
    expect(messages.map((msg) => msg.id)).toEqual(['oldest', 'middle', 'newest']);
    expect(truncated).toBe(false);
    // Display order is a copy — the query result is left untouched.
    expect(input.map((msg) => msg.id)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('handles an empty thread', () => {
    expect(toThreadDisplay([])).toEqual({ messages: [], truncated: false });
  });

  it('flags truncation only when the window is exactly full', () => {
    const full = Array.from({ length: LATEST_MESSAGES_TAKE }, (_, i) => ({ id: i }));
    expect(toThreadDisplay(full).truncated).toBe(true);
    expect(toThreadDisplay(full.slice(1)).truncated).toBe(false);
  });
});
