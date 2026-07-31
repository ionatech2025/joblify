'use client';

import { useEffect, useState, useTransition } from 'react';
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
import { useEmployerSetupDraftStore } from '@/lib/stores/employer-setup-draft';
import { toast } from '@/lib/stores/ui';

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

const initialValues: CompanyProfileInput = {
  companyName: '',
  industry: 'TECHNOLOGY',
  companySize: 'SIZE_1_10',
  description: '',
  website: '',
  linkedin: '',
};

export function EmployerSetupForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const draftStore = useEmployerSetupDraftStore();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CompanyProfileInput>({
    resolver: zodResolver(CompanyProfileSchema),
    defaultValues: initialValues,
  });

  // Restore a saved draft once on mount (draft wins over defaults for any
  // field it has a value for). An empty draft shouldn't touch the form.
  useEffect(() => {
    if (Object.keys(draftStore.draft).length > 0) {
      reset({ ...initialValues, ...draftStore.draft });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change so accidental navigation doesn't lose the draft.
  useEffect(() => {
    const sub = watch((values) => draftStore.update(values));
    return () => sub.unsubscribe();
  }, [watch, draftStore]);

  function onSubmit(values: CompanyProfileInput) {
    setError(null);
    start(async () => {
      try {
        await createCompanyProfile(values);
        draftStore.clear();
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
