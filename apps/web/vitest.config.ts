import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['lib/**', 'app/**'],
      exclude: ['**/*.d.ts', '**/*.test.*', '.next/**'],
      // A ratchet, not a target. Coverage was configured here from the start
      // but had no script and no threshold, so it was collected only if
      // someone typed the flag and gated nothing. These are today's numbers
      // rounded down: the point is that they can no longer fall, and every
      // test added moves the floor up. Raise them when you add a batch.
      //
      // The absolute figures are low because `include` spans all of app/**,
      // most of which is JSX that only the (self-skipping) Playwright suites
      // reach. Judge a change by the delta, not the number.
      thresholds: {
        statements: 18,
        branches: 60,
        functions: 25,
        lines: 18,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
