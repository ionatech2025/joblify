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
import { Field, Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';

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
        toast.success('Company created', "Let's post your first job.");
        router.push('/company/jobs');
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not create your company. Try again.';
        setError(message);
        toast.error("Couldn't create your company", message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
      <Field label="Company name" error={errors.companyName?.message}>
        <Input {...register('companyName')} placeholder="Acme Inc." />
      </Field>

      <Field label="Industry">
        <Select {...register('industry')}>
          {INDUSTRY_OPTIONS.map((i) => (
            <option key={i} value={i}>
              {titleCase(i)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Company size">
        <Select {...register('companySize')}>
          {SIZE_VALUES.map((s) => (
            <option key={s} value={s}>
              {SIZE_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="About the company" error={errors.description?.message}>
        <Textarea
          {...register('description')}
          rows={5}
          placeholder="What you do, your mission, and what it's like to work there."
        />
      </Field>

      <Field label="Website (optional)" error={errors.website?.message}>
        <Input {...register('website')} placeholder="https://acme.com" />
      </Field>

      {error && <p className="m-0 text-danger">{error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Creating…' : 'Create company & continue'}
      </Button>
    </form>
  );
}
