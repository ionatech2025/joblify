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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Raw apostrophes/quotes in JSX copy render fine and are not an a11y/XSS
      // concern; the rule is noise for a content-heavy marketing surface.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'prisma/migrations/**', 'playwright-report/**'],
  },
];

export default eslintConfig;
