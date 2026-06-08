import { z } from 'zod';

// Shared by the create (/employer-setup) and edit (/company/settings) forms and
// the company Server Actions. Plain module (no 'use server'/'use client') so it
// is safe to import on both sides.

export const INDUSTRY_OPTIONS = [
  'TECHNOLOGY',
  'HOSPITALITY',
  'EDUCATION',
  'AGRICULTURE',
  'FINANCE',
  'MANUFACTURING',
  'CONSTRUCTION',
  'HEALTHCARE',
  'RETAIL',
  'TRANSPORTATION',
  'ENERGY',
  'MEDIA',
  'GOVERNMENT',
  'NONPROFIT',
  'OTHER',
] as const;

export const SIZE_VALUES = [
  'SIZE_1_10',
  'SIZE_11_50',
  'SIZE_51_200',
  'SIZE_201_500',
  'SIZE_501_1000',
  'SIZE_1001_PLUS',
] as const;

export const SIZE_LABELS: Record<(typeof SIZE_VALUES)[number], string> = {
  SIZE_1_10: '1–10',
  SIZE_11_50: '11–50',
  SIZE_51_200: '51–200',
  SIZE_201_500: '201–500',
  SIZE_501_1000: '501–1,000',
  SIZE_1001_PLUS: '1,001+',
};

export const CompanyProfileSchema = z.object({
  companyName: z.string().min(2).max(140),
  industry: z.enum(INDUSTRY_OPTIONS),
  companySize: z.enum(SIZE_VALUES),
  description: z.string().min(20).max(4000),
  website: z.string().url().max(200).optional().or(z.literal('')),
  linkedin: z.string().url().max(200).optional().or(z.literal('')),
});

export type CompanyProfileInput = z.infer<typeof CompanyProfileSchema>;
