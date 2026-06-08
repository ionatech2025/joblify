import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, companies] = await Promise.all([
    db.jobPost.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { slug: true, updatedAt: true },
      take: 5000,
      orderBy: { publishedAt: 'desc' },
    }),
    db.companyProfile.findMany({
      where: { verificationStatus: 'VERIFIED' },
      select: { slug: true, updatedAt: true },
      take: 1000,
    }),
  ]);

  return [
    { url: `${siteUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/companies`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.3 },
    ...jobs.map((j) => ({
      url: `${siteUrl}/jobs/${j.slug}`,
      lastModified: j.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...companies.map((c) => ({
      url: `${siteUrl}/companies/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ];
}
