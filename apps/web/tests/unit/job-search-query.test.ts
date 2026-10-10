import { describe, it, expect } from 'vitest';
import { canonicalSearchString } from '@/lib/search/job-search-query';

// The server render and the client query hook both key off this string, so a
// page rendered for one spelling of a search must be recognised as the data
// for every other spelling of it.

describe('canonicalSearchString', () => {
  it('is empty for no params', () => {
    expect(canonicalSearchString('')).toBe('');
    expect(canonicalSearchString({})).toBe('');
    expect(canonicalSearchString(new URLSearchParams())).toBe('');
  });

  it('does not depend on parameter order', () => {
    expect(canonicalSearchString('sort=recent&q=react')).toBe(
      canonicalSearchString('q=react&sort=recent'),
    );
  });

  it('drops empty values and a spelled-out first page', () => {
    expect(canonicalSearchString('q=react&location=&page=0&salaryMin=')).toBe('q=react');
  });

  it('keeps a non-default page', () => {
    expect(canonicalSearchString('q=react&page=2')).toBe('page=2&q=react');
  });

  it('gives the same answer for a URLSearchParams, a string and a Next searchParams object', () => {
    const fromString = canonicalSearchString('q=react+native&workMode=REMOTE');
    expect(canonicalSearchString(new URLSearchParams('q=react+native&workMode=REMOTE'))).toBe(
      fromString,
    );
    expect(canonicalSearchString({ workMode: 'REMOTE', q: 'react native' })).toBe(fromString);
  });

  it('keeps repeated keys, in a stable order', () => {
    expect(canonicalSearchString({ skill: ['b', 'a'] })).toBe('skill=a&skill=b');
    expect(canonicalSearchString('skill=b&skill=a')).toBe('skill=a&skill=b');
  });

  it('skips undefined values from a Next searchParams object', () => {
    expect(canonicalSearchString({ q: undefined, sort: 'salary' })).toBe('sort=salary');
  });

  it('percent-encodes the way the API route parses it back', () => {
    const key = canonicalSearchString({ q: 'c++ & rust' });
    expect(new URLSearchParams(key).get('q')).toBe('c++ & rust');
  });
});
