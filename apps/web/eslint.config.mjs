import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

// Next 16 ships native flat configs — spread them directly. (FlatCompat +
// eslint-config-next@16 crashes ESLint 9's config validator with a circular
// structure error.)
const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Raw apostrophes/quotes in JSX copy render fine and are not an a11y/XSS
      // concern; the rule is noise for a content-heavy marketing surface.
      'react/no-unescaped-entities': 'off',
    },
  },
  // Type-aware rules. The default Next preset lints syntax only, so it cannot
  // see that `void sendStatusEmail(...)` or an un-awaited `resend...send()`
  // is a promise nobody is waiting for — on Fluid Compute such a promise can be
  // dropped the moment the response is sent. post-job.ts already wrote that rule
  // down in a comment; this makes the linter enforce it.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      // checksVoidReturn.attributes off: passing an async handler to an
      // onClick/onSubmit prop is idiomatic React and not a defect.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'prisma/migrations/**',
      'playwright-report/**',
      'coverage/**',
    ],
  },
];

export default eslintConfig;
