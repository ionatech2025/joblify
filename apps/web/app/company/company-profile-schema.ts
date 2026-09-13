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
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(140),
  industry: z.enum(INDUSTRY_OPTIONS, {
    errorMap: () => ({ message: 'Please select a valid industry' }),
  }),
  companySize: z.enum(SIZE_VALUES, {
    errorMap: () => ({ message: 'Please select a valid company size' }),
  }),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(4000),
  contactPersonName: z.string().trim().max(100).optional().or(z.literal('')),
  contactPersonPosition: z.string().trim().max(100).optional().or(z.literal('')),
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 numeric digits').optional().or(z.literal('')),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  website: z.string().trim().url('Invalid website URL').max(200).optional().or(z.literal('')),
  linkedin: z.string().trim().url('Invalid LinkedIn URL').max(200).optional().or(z.literal('')),
  logoUrl: z.string().trim().url('Invalid logo URL').optional().or(z.literal('')),
});

export type CompanyProfileInput = z.infer<typeof CompanyProfileSchema>;
