// Chat threads page from the newest end of history: the thread pages query the
// latest LATEST_MESSAGES_TAKE messages (`orderBy createdAt desc`), and this
// helper flips that page back into chronological order for <ChatThread>.
// `truncated` — an exactly-full window — means older messages exist beyond it,
// which the pages surface as a "Showing the latest N messages" note.
export const LATEST_MESSAGES_TAKE = 100;

export function toThreadDisplay<T>(newestFirst: T[]): { messages: T[]; truncated: boolean } {
  return {
    messages: [...newestFirst].reverse(),
    truncated: newestFirst.length >= LATEST_MESSAGES_TAKE,
  };
}
