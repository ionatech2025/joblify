'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { z } from 'zod';

// Shared job form: schema + fields, used by both the create (/company/jobs/new)
// and edit (/company/jobs/[id]/edit) forms so they can't drift.

const INDUSTRIES = [
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

export const PostJobFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(140),
  description: z.string().min(50, 'Add a detailed description (50+ chars)').max(10_000),
  requirements: z.string().max(5000).optional().or(z.literal('')),
  industry: z.enum(INDUSTRIES),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY']),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'STAFF', 'EXECUTIVE']),
  workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']),
  location: z.string().max(140).optional().or(z.literal('')),
  salaryMin: z.coerce.number().int().min(0).nullable(),
  salaryMax: z.coerce.number().int().min(0).nullable(),
  salaryCurrency: z.string().length(3).default('USD'),
  applicationDeadline: z.string().optional().or(z.literal('')),
  publish: z.boolean().default(true),
});

export type PostJobFormValues = z.infer<typeof PostJobFormSchema>;

export function JobFormFields({
  register,
  errors,
}: {
  register: UseFormRegister<PostJobFormValues>;
  errors: FieldErrors<PostJobFormValues>;
}) {
  return (
    <>
      <Field label="Title" error={errors.title?.message}>
        <input {...register('title')} style={input} placeholder="Senior Backend Engineer" />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <textarea {...register('description')} rows={10} style={input} placeholder="The role, the team, what success looks like." />
      </Field>

      <Field label="Requirements" error={errors.requirements?.message}>
        <textarea {...register('requirements')} rows={6} style={input} placeholder="Must-haves and nice-to-haves." />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Industry" error={errors.industry?.message}>
          <select {...register('industry')} style={input}>
            {INDUSTRIES.map((v) => (
              <option key={v} value={v}>
                {v.charAt(0) + v.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Job type" error={errors.jobType?.message}>
          <select {...register('jobType')} style={input}>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="TEMPORARY">Temporary</option>
          </select>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Experience level">
          <select {...register('experienceLevel')} style={input}>
            <option value="ENTRY">Entry</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
            <option value="STAFF">Staff</option>
            <option value="EXECUTIVE">Executive</option>
          </select>
        </Field>
        <Field label="Work mode">
          <select {...register('workMode')} style={input}>
            <option value="ONSITE">On-site</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </select>
        </Field>
      </div>

      <Field label="Location">
        <input {...register('location')} style={input} placeholder="Berlin, DE" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '1rem' }}>
        <Field label="Salary min">
          <input type="number" {...register('salaryMin')} style={input} />
        </Field>
        <Field label="Salary max">
          <input type="number" {...register('salaryMax')} style={input} />
        </Field>
        <Field label="Currency">
          <input {...register('salaryCurrency')} style={input} maxLength={3} />
        </Field>
      </div>

      <Field label="Application deadline">
        <input type="date" {...register('applicationDeadline')} style={input} />
      </Field>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" {...register('publish')} />
        <span>Published (uncheck to move to draft)</span>
      </label>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.9rem', color: '#444' }}>{label}</span>
      {children}
      {error && <span style={{ fontSize: '0.85rem', color: '#a00' }}>{error}</span>}
    </label>
  );
}

const input: React.CSSProperties = {
  padding: '0.6rem',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: '0.95rem',
};
