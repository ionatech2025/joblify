import { describe, expect, it } from 'vitest';
import { AuthError } from '@/lib/auth';

describe('AuthError', () => {
  it('carries a code', () => {
    const e = new AuthError('FORBIDDEN');
    expect(e.code).toBe('FORBIDDEN');
    expect(e.name).toBe('AuthError');
  });
});
