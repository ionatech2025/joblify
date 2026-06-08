'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { postJob } from '@/app/actions/post-job';

export const PostJobFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(140),
  description: z.string().min(50, 'Add a detailed description (50+ chars)').max(10_000),
  requirements: z.string().max(5000).optional().or(z.literal('')),
  industry: z.enum([
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
  ]),
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

export function PostJobForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(PostJobFormSchema),
    defaultValues: {
      industry: 'TECHNOLOGY',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      workMode: 'ONSITE',
      salaryCurrency: 'USD',
      salaryMin: null,
      salaryMax: null,
      publish: true,
    },
  });

  function onSubmit(values: PostJobFormValues) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await postJob(values);
        router.push(`/company/jobs/${id}/edit?just_posted=1`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to post job.');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}
    >
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
            {[
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
            ].map((v) => (
              <option key={v} value={v}>
                {v.replace('_', ' ')}
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
        <input type="checkbox" {...register('publish')} defaultChecked />
        <span>Publish immediately (uncheck to save as draft)</span>
      </label>

      {error && <p style={{ color: '#a00', margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '0.75rem 1.25rem',
          background: '#111',
          color: 'white',
          borderRadius: 8,
          border: 0,
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer',
        }}
      >
        {isPending ? 'Saving…' : 'Post job'}
      </button>
    </form>
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
