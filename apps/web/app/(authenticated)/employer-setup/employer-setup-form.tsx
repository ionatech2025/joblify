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
import { Input, Select, Textarea } from '@/app/components/ui/form';
import {
  FormSheet,
  SheetField,
  SheetGroup,
  SheetGroups,
  SheetTitle,
} from '@/app/components/console/sheet';
import { DirtyBar } from '@/app/components/console/dirty-bar';
import { useEmployerSetupDraftStore } from '@/lib/stores/employer-setup-draft';
import { useFormDraft } from '@/lib/use-form-draft';
import { useHydrated } from '@/lib/use-hydrated';
import { toast } from '@/lib/stores/ui';
import { industryLabel } from '@/lib/ui/status';

const initialValues: CompanyProfileInput = {
  companyName: '',
  industry: 'TECHNOLOGY',
  companySize: 'SIZE_1_10',
  description: '',
  address: '',
  phone: '',
  website: '',
  linkedin: '',
};

export function EmployerSetupForm({ hasJobSeekerIdentity }: { hasJobSeekerIdentity: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const clearDraft = useEmployerSetupDraftStore((s) => s.clear);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyProfileInput>({
    resolver: zodResolver(CompanyProfileSchema),
    defaultValues: initialValues,
  });

  // Restore on mount, then persist on a debounce. See lib/use-form-draft.ts.
  useFormDraft({
    store: useEmployerSetupDraftStore,
    watch,
    reset,
    initial: initialValues,
    onRestore: () => setRestoredDraft(true),
  });

  function onSubmit(values: CompanyProfileInput) {
    // createCompanyProfile flips the account's userType to COMPANY (see
    // app/actions/company.ts) — a one-way switch with no undo path. A
    // jobseeker who already has a profile could reach this page via the
    // header's always-visible "Post a job" link or the command palette
    // without meaning to give up their jobseeker identity, so make that cost
    // explicit before the irreversible submit, matching this app's existing
    // confirm-gate convention for other one-way actions.
    if (
      hasJobSeekerIdentity &&
      !window.confirm(
        'Creating a company switches your account to an employer — you will lose access to your jobseeker profile, applications, and saved jobs. Continue?',
      )
    ) {
      return;
    }
    setError(null);
    start(async () => {
      try {
        await createCompanyProfile(values);
        clearDraft();
        setRestoredDraft(false);
        toast.success('Company created', "Let's post your first job.");
        router.push('/company/jobs');
        router.refresh();
      } catch (err) {
        let message =
          err instanceof Error ? err.message : 'Could not create your company. Try again.';
        if (message.includes('Server Components render') || message.includes('digest')) {
          message =
            'A company with this name may already be registered, or your details could not be saved.';
        }
        setError(message);
        toast.error("Couldn't create your company", message);
      }
    });
  }

  return (
    // noValidate: the schema owns validation and its messages (the browser's
    // own check ran first for type=url and showed a transient, unannounced bubble).
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset disabled={!hydrated} className="m-0 contents border-0 p-0">
        <FormSheet>
          <SheetTitle
            title="Company profile"
            subtitle="Create your company profile to start posting jobs and reviewing applicants."
          />

          {hasJobSeekerIdentity && (
            <p className="text-warn bg-warn-subtle rounded-card border-warn/25 m-0 mb-4 border px-4 py-3 text-sm">
              You already have a jobseeker profile. Creating a company switches your account to an
              employer — you&apos;ll lose access to your jobseeker profile, applications, and saved
              jobs.
            </p>
          )}

          <SheetGroups>
            <SheetGroup title="Identity">
              <SheetField label="Company name" required error={errors.companyName?.message}>
                <Input
                  defaultValue={initialValues.companyName}
                  {...register('companyName')}
                  autoComplete="organization"
                  placeholder="Acme Inc."
                />
              </SheetField>
              <SheetField label="Industry">
                <Select defaultValue={initialValues.industry} {...register('industry')}>
                  {INDUSTRY_OPTIONS.map((i) => (
                    <option key={i} value={i}>
                      {industryLabel(i)}
                    </option>
                  ))}
                </Select>
              </SheetField>
              <SheetField label="Company size">
                <Select defaultValue={initialValues.companySize} {...register('companySize')}>
                  {SIZE_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {SIZE_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </SheetField>
            </SheetGroup>

            <SheetGroup title="Location & links">
              <SheetField label="Address / location" error={errors.address?.message}>
                <Input
                  defaultValue={initialValues.address ?? ''}
                  {...register('address')}
                  autoComplete="street-address"
                  placeholder="Kampala, Uganda"
                />
              </SheetField>
              <SheetField label="Phone (optional)" error={errors.phone?.message}>
                <Input
                  type="tel"
                  defaultValue={initialValues.phone ?? ''}
                  {...register('phone')}
                  autoComplete="tel"
                  placeholder="+256 743 535 678"
                />
              </SheetField>
              <SheetField label="Website (optional)" error={errors.website?.message}>
                <Input
                  type="url"
                  defaultValue={initialValues.website ?? ''}
                  {...register('website')}
                  autoComplete="url"
                  placeholder="https://acme.com"
                />
              </SheetField>
            </SheetGroup>

            <SheetGroup title="About" wide>
              <SheetField
                label="About the company"
                required
                hint="At least 20 characters: what you do and what it is like to work there."
                error={errors.description?.message}
                wide
              >
                <Textarea
                  defaultValue={initialValues.description}
                  {...register('description')}
                  rows={5}
                  placeholder="What you do, your mission, and what it's like to work there."
                />
              </SheetField>
            </SheetGroup>
          </SheetGroups>

          {error && (
            <p role="alert" className="m-0 mt-4 text-danger">
              {error}
            </p>
          )}

          <DirtyBar
            dirty={isDirty || restoredDraft}
            saving={pending}
            onDiscard={() => {
              clearDraft();
              reset(initialValues);
              setRestoredDraft(false);
            }}
            saveLabel="Create company & continue"
            savingLabel="Creating…"
          />
        </FormSheet>
      </fieldset>
    </form>
  );
}
