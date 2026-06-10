import { describe, expect, it } from 'vitest';
import { tags } from '@/lib/cache';

describe('cache tags', () => {
  it('namespaces job tags by id', () => {
    expect(tags.job('abc')).toBe('job:abc');
    expect(tags.userApplications('u1')).toBe('user:u1:applications');
  });
});
