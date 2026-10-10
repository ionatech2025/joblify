import { describe, it, expect } from 'vitest';
import { createLogger } from '@/lib/observability/logger';

function capture() {
  const lines: string[] = [];
  const log = createLogger({ write: (s: string) => void lines.push(s) });
  return { log, out: () => lines.join('') };
}

describe('logger redaction', () => {
  it('redacts credentials and personal data, top-level and one level down', () => {
    const { log, out } = capture();
    log.warn(
      {
        email: 'top@x.test',
        user: { email: 'ada@x.test', phone: '+256700000000', password: 'hunter2' },
        application: { coverLetter: 'Dear Sir…', recruiterNotes: 'weak on SQL' },
        resume: { fileBlobUrl: 'https://s.private.blob.vercel-storage.com/resumes/u/cv.pdf' },
        userId: 'u-123',
      },
      'context',
    );
    const text = out();
    for (const secret of [
      'top@x.test',
      'ada@x.test',
      '+256700000000',
      'hunter2',
      'Dear Sir',
      'weak on SQL',
      'blob.vercel-storage.com',
    ]) {
      expect(text, secret).not.toContain(secret);
    }
    // …while the identifiers needed to debug stay.
    expect(text).toContain('u-123');
    expect(text).toContain('[REDACTED]');
  });
});
