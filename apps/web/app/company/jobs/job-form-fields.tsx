'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { z } from 'zod';
import { Field, Input, Select, Textarea } from '@/app/components/ui/form';

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
        <Input {...register('title')} placeholder="Senior Backend Engineer" />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <Textarea {...register('description')} rows={10} placeholder="The role, the team, what success looks like." />
      </Field>

      <Field label="Requirements" error={errors.requirements?.message}>
        <Textarea {...register('requirements')} rows={6} placeholder="Must-haves and nice-to-haves." />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Industry" error={errors.industry?.message}>
          <Select {...register('industry')}>
            {INDUSTRIES.map((v) => (
              <option key={v} value={v}>
                {v.charAt(0) + v.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Job type" error={errors.jobType?.message}>
          <Select {...register('jobType')}>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="TEMPORARY">Temporary</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Experience level">
          <Select {...register('experienceLevel')}>
            <option value="ENTRY">Entry</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
            <option value="STAFF">Staff</option>
            <option value="EXECUTIVE">Executive</option>
          </Select>
        </Field>
        <Field label="Work mode">
          <Select {...register('workMode')}>
            <option value="ONSITE">On-site</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </Select>
        </Field>
      </div>

      <Field label="Location">
        <Input {...register('location')} placeholder="Berlin, DE" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_120px]">
        <Field label="Salary min">
          <Input type="number" {...register('salaryMin')} />
        </Field>
        <Field label="Salary max">
          <Input type="number" {...register('salaryMax')} />
        </Field>
        <Field label="Currency">
          <Input {...register('salaryCurrency')} maxLength={3} />
        </Field>
      </div>

      <Field label="Application deadline">
        <Input type="date" {...register('applicationDeadline')} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register('publish')} />
        Published (uncheck to move to draft)
      </label>
    </>
  );
}
