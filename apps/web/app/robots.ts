import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Crawlers that collect content to TRAIN models (as opposed to search and
// AI-answer retrieval, which stay allowed because they send people to job
// postings). Job postings and company pages are published for candidates, not
// as a free training corpus. Flip with ROBOTS_ALLOW_AI_TRAINING=1.
const AI_TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'Meta-ExternalAgent',
  'cohere-ai',
  'Omgilibot',
];

const PRIVATE_PATHS = [
  '/api/',
  '/dashboard/',
  '/jobseeker/',
  '/company/',
  '/account/',
  '/admin/',
  '/onboarding/',
  '/employer-setup/',
];

export default function robots(): MetadataRoute.Robots {
  const allowTraining = process.env.ROBOTS_ALLOW_AI_TRAINING === '1';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      ...(allowTraining ? [] : [{ userAgent: AI_TRAINING_CRAWLERS, disallow: '/' }]),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
