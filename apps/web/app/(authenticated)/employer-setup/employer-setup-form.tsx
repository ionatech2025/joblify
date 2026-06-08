'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  CompanyProfileSchema,
  type CompanyProfileInput,
  INDUSTRY_OPTIONS,
  SIZE_VALUES,
  SIZE_LABELS,
} from '@/app/company/company-profile-schema';
import { createCompanyProfile } from '@/app/actions/company';

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.35rem' };
const control: React.CSSProperties = { padding: '0.6rem', border: '1px solid #ccc', borderRadius: 6 };

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function EmployerSetupForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyProfileInput>({
    resolver: zodResolver(CompanyProfileSchema),
    defaultValues: {
      companyName: '',
      industry: 'TECHNOLOGY',
      companySize: 'SIZE_1_10',
      description: '',
      website: '',
      linkedin: '',
    },
  });

  function onSubmit(values: CompanyProfileInput) {
    setError(null);
    start(async () => {
      try {
        await createCompanyProfile(values);
        router.push('/company/jobs');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create your company. Try again.');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}
    >
      <label style={field}>
        <span>Company name</span>
        <input {...register('companyName')} style={control} placeholder="Acme Inc." />
        {errors.companyName && <small style={{ color: '#a00' }}>{errors.companyName.message}</small>}
      </label>

      <label style={field}>
        <span>Industry</span>
        <select {...register('industry')} style={control}>
          {INDUSTRY_OPTIONS.map((i) => (
            <option key={i} value={i}>
              {titleCase(i)}
            </option>
          ))}
        </select>
      </label>

      <label style={field}>
        <span>Company size</span>
        <select {...register('companySize')} style={control}>
          {SIZE_VALUES.map((s) => (
            <option key={s} value={s}>
              {SIZE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label style={field}>
        <span>About the company</span>
        <textarea
          {...register('description')}
          rows={5}
          style={control}
          placeholder="What you do, your mission, and what it's like to work there."
        />
        {errors.description && <small style={{ color: '#a00' }}>{errors.description.message}</small>}
      </label>

      <label style={field}>
        <span>Website (optional)</span>
        <input {...register('website')} style={control} placeholder="https://acme.com" />
        {errors.website && <small style={{ color: '#a00' }}>{errors.website.message}</small>}
      </label>

      {error && <p style={{ color: '#a00', margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '0.75rem 1.25rem',
          background: '#111',
          color: '#fff',
          border: 0,
          borderRadius: 8,
          fontWeight: 600,
          cursor: pending ? 'wait' : 'pointer',
        }}
      >
        {pending ? 'Creating…' : 'Create company & continue'}
      </button>
    </form>
  );
}
