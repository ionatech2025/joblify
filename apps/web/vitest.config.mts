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
      // A ratchet, not a target. Thresholds are today's numbers rounded down:
      // the point is that they can no longer fall, and every test added moves
      // the floor up. Raise them when you add a batch.
      //
      // Re-baselined 2026-10-10 when the runner moved from Vitest 2 to 5. The
      // measured branch figure came out lower than the old 60% floor even
      // though ~200 tests were added (statements went 18% → ~45%), so the
      // accounting differs between those versions; treat the two series as not
      // comparable and ratchet from these numbers.
      //
      // The absolute figures are low because `include` spans all of app/**,
      // most of which is JSX that only the (self-skipping) Playwright suites
      // reach. Judge a change by the delta, not the number.
      thresholds: {
        statements: 50,
        branches: 46,
        functions: 36,
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
});
