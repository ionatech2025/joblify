import { z } from 'zod';

export const ResumeSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  headline: z.string().nullable(),
  yearsExperience: z.number().int().min(0).max(70).nullable(),
  summary: z.string().nullable(),
  skills: z.array(z.string()).max(40),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
        description: z.string().nullable(),
      }),
    )
    .max(20),
  education: z
    .array(
      z.object({
        school: z.string(),
        degree: z.string().nullable(),
        field: z.string().nullable(),
        startYear: z.number().int().min(1900).max(2100).nullable(),
        endYear: z.number().int().min(1900).max(2100).nullable(),
      }),
    )
    .max(10),
  certifications: z.array(z.string()).max(20),
});

export type ParsedResume = z.infer<typeof ResumeSchema>;

// Stable system prompt → cacheable. Volatile resume text goes in the user turn.
export const RESUME_PARSE_SYSTEM = `You extract structured fields from a resume.
Return JSON matching the schema exactly. Rules:
- Never invent facts. If a field is missing, return null (or [] for arrays).
- Normalize dates to YYYY-MM where possible; preserve original text if ambiguous.
- Skills are short noun phrases (e.g. "TypeScript", "Postgres"), not sentences.
- Trim whitespace. Use sentence case for titles.
- yearsExperience is total professional years rounded down.`;
