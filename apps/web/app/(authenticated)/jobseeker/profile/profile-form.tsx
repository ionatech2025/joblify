'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { optionalPhone } from '@/lib/validation/phone';
import { useState, useTransition } from 'react';
import { saveProfile } from '@/app/actions/profile';
import { Checkbox, Field, Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';
import { useProfileDraftStore } from '@/lib/stores/profile-draft';
import { useFormDraft } from '@/lib/use-form-draft';
import { toast } from '@/lib/stores/ui';
import { MAX_PROFILE_SKILLS, PROFILE_SKILLS_LIMIT_MESSAGE } from '@/lib/profile-limits';

const ProfileFormSchema = z
  .object({
    profileType: z.enum(['EMPLOYABLE', 'VIRTUAL_INTERN']),
    headline: z.string().max(140).optional().or(z.literal('')),
    bio: z.string().trim().min(1, 'Bio is required.').max(2000),
    yearsExperience: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.coerce
        .number()
        .int()
        .min(0, 'Years of experience cannot be negative.')
        .max(70, 'Years of experience cannot exceed 70.')
        .nullable()
        .optional(),
    ),
    location: z.string().max(140).optional().or(z.literal('')),
    phone: optionalPhone,
    desiredSalaryMin: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.coerce.number().int().min(0, 'Salary cannot be negative.').nullable().optional(),
    ),
    desiredSalaryMax: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.coerce.number().int().min(0, 'Salary cannot be negative.').nullable().optional(),
    ),
    desiredWorkMode: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable().optional(),
    ),
    visibility: z.enum(['PUBLIC', 'PRIVATE']),
    careerInterest: z.string().max(140).optional().or(z.literal('')),
    availabilityHoursPerWeek: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.coerce
        .number()
        .int()
        .min(1, 'Hours per week must be between 1 and 80.')
        .max(80, 'Hours per week must be between 1 and 80.')
        .nullable()
        .optional(),
    ),
    learningGoal: z.string().max(500).optional().or(z.literal('')),
    education: z.string().trim().min(1, 'Education is required.').max(1000),
    certifications: z.string().max(1000).optional().or(z.literal('')),
    portfolioUrl: z
      .string()
      .trim()
      .max(300)
      .optional()
      .or(z.literal(''))
      .refine((val) => !val || z.string().url().safeParse(val).success, {
        message: 'Invalid portfolio URL (e.g. https://github.com/yourname)',
      }),
    skillSlugs: z
      .array(z.string())
      .max(MAX_PROFILE_SKILLS, PROFILE_SKILLS_LIMIT_MESSAGE)
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.profileType === 'EMPLOYABLE') {
      if (!data.skillSlugs || data.skillSlugs.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['skillSlugs'],
          message: 'An employable profile must have at least one skill selected.',
        });
      }
    }
  });

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export function ProfileForm({
  initial,
  allSkills,
}: {
  initial: ProfileFormValues;
  allSkills: Array<{ slug: string; label: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Selectors, not the whole store: a bare useProfileDraftStore() subscribes
  // the form to its own writes and re-renders it on every keystroke.
  const clearDraft = useProfileDraftStore((s) => s.clear);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: initial,
  });

  const isVirtualIntern = useWatch({ control, name: 'profileType' }) === 'VIRTUAL_INTERN';
  const selectedSkills = useWatch({ control, name: 'skillSlugs' });
  const selectedCount = Array.isArray(selectedSkills) ? selectedSkills.length : 0;
  // Narrows the list below; every checkbox stays mounted (hidden, not removed),
  // so a selection made before filtering is still submitted.
  const [skillQuery, setSkillQuery] = useState('');
  const needle = skillQuery.trim().toLowerCase();
  const visibleSkills = needle
    ? allSkills.filter((s) => s.label.toLowerCase().includes(needle)).length
    : allSkills.length;

  // Restore on mount, then persist on a debounce. See lib/use-form-draft.ts.
  useFormDraft({ store: useProfileDraftStore, watch, reset, initial });

  function onSubmit(values: ProfileFormValues) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveProfile(values);
        setSaved(true);
        clearDraft();
        toast.success('Profile updated successfully');
      } catch (err) {
        let message = err instanceof Error ? err.message : 'Save failed.';
        if (message.includes('Server Components render') || message.includes('digest')) {
          message =
            'Please check that all required fields (Bio, Education, and Skills) are filled in properly.';
        }
        setError(message);
        toast.error("Couldn't save your profile", message);
      }
    });
  }

  return (
    // noValidate: the zod schema above owns validation, with messages written for
    // this form. Without it the browser's own check ran first for type=url and
    // blocked the submit with an unstyled, transient bubble ("Please enter a
    // URL.") — no inline error, no aria-invalid, nothing announced — and the
    // schema's message ("Invalid portfolio URL (e.g. https://github.com/…)")
    // never showed.
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
      <Field label="Profile type" error={errors.profileType?.message}>
        <Select {...register('profileType')}>
          <option value="EMPLOYABLE">Employable — looking for a role</option>
          <option value="VIRTUAL_INTERN">Virtual intern — looking for experience</option>
        </Select>
      </Field>

      {isVirtualIntern && (
        <div className="flex flex-col gap-4 rounded-card border border-border bg-brand-subtle p-4">
          <Field label="Career interest" error={errors.careerInterest?.message}>
            <Input {...register('careerInterest')} placeholder="Digital marketing" />
          </Field>
          <Field
            label="Availability (hours per week)"
            error={errors.availabilityHoursPerWeek?.message}
          >
            <Input type="number" {...register('availabilityHoursPerWeek')} min={1} max={80} />
          </Field>
          <Field label="Learning goal" error={errors.learningGoal?.message}>
            <Textarea
              {...register('learningGoal')}
              rows={3}
              placeholder="What do you want to get out of a virtual internship?"
            />
          </Field>
        </div>
      )}

      <Field label="Headline" error={errors.headline?.message}>
        <Input
          {...register('headline')}
          autoComplete="organization-title"
          placeholder="Senior Backend Engineer · Berlin"
        />
      </Field>

      <Field label="Bio" required error={errors.bio?.message}>
        <Textarea
          {...register('bio')}
          rows={6}
          placeholder="A short summary of what you do and what you're looking for."
        />
      </Field>

      <fieldset
        className="flex flex-col gap-1"
        aria-describedby={errors.skillSlugs?.message ? 'skills-error' : undefined}
        aria-invalid={errors.skillSlugs?.message ? true : undefined}
      >
        <legend className="text-sm font-medium text-fg-muted">
          Skills {isVirtualIntern ? '(optional)' : '(choose at least 1)'}
        </legend>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Input
            type="search"
            value={skillQuery}
            onChange={(e) => setSkillQuery(e.target.value)}
            // Enter would submit the profile; here it only means "done typing".
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            aria-label="Filter skills"
            placeholder="Filter skills…"
            autoComplete="off"
            className="sm:max-w-xs"
          />
          {/* Polite, and only what changed: how many are chosen, and how many
              match the filter. */}
          <p role="status" className="m-0 text-sm text-fg-muted">
            {selectedCount} selected
            {needle ? ` · ${visibleSkills} match${visibleSkills === 1 ? '' : 'es'}` : ''}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-control border border-border-strong bg-surface p-3 sm:grid-cols-3">
          {allSkills.map((skill) => (
            <Checkbox
              key={skill.slug}
              value={skill.slug}
              label={skill.label}
              className={`py-1${needle && !skill.label.toLowerCase().includes(needle) ? ' hidden' : ''}`}
              {...register('skillSlugs')}
            />
          ))}
          {needle && visibleSkills === 0 ? (
            <p className="col-span-full m-0 text-sm text-fg-muted">
              No skill matches &ldquo;{skillQuery.trim()}&rdquo;.
            </p>
          ) : null}
        </div>
        {errors.skillSlugs?.message && (
          <span id="skills-error" role="alert" className="text-sm text-danger">
            {errors.skillSlugs.message}
          </span>
        )}
      </fieldset>

      <Field label="Years of professional experience" error={errors.yearsExperience?.message}>
        <Input
          type="number"
          inputMode="numeric"
          {...register('yearsExperience')}
          min={0}
          max={70}
        />
      </Field>

      <Field label="Education" required error={errors.education?.message}>
        <Textarea
          {...register('education')}
          rows={3}
          placeholder="B.Sc. Computer Science, University of Nairobi (2018–2022)"
        />
      </Field>

      <Field label="Certifications" error={errors.certifications?.message}>
        <Textarea
          {...register('certifications')}
          rows={3}
          placeholder="AWS Certified Solutions Architect (2024)"
        />
      </Field>

      <Field label="Portfolio / GitHub link" error={errors.portfolioUrl?.message}>
        <Input
          type="url"
          {...register('portfolioUrl')}
          autoComplete="url"
          placeholder="https://github.com/yourname"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Location" error={errors.location?.message}>
          <Input {...register('location')} autoComplete="address-level2" placeholder="Berlin, DE" />
        </Field>
        <Field
          label="Phone number"
          hint="Optional. Add the country code for an international number, e.g. +256 743 535 678"
          error={errors.phone?.message}
        >
          <Input
            type="tel"
            {...register('phone')}
            autoComplete="tel"
            placeholder="+256 743 535 678"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Desired min salary (annual)" error={errors.desiredSalaryMin?.message}>
          <Input type="number" inputMode="numeric" {...register('desiredSalaryMin')} />
        </Field>
        <Field label="Desired max salary (annual)" error={errors.desiredSalaryMax?.message}>
          <Input type="number" inputMode="numeric" {...register('desiredSalaryMax')} />
        </Field>
      </div>

      <Field label="Preferred work mode" error={errors.desiredWorkMode?.message}>
        <Select {...register('desiredWorkMode')}>
          <option value="">No preference</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-site</option>
        </Select>
      </Field>

      <Field label="Profile visibility" error={errors.visibility?.message}>
        <Select {...register('visibility')}>
          <option value="PRIVATE">Private — only visible to companies I apply to</option>
          <option value="PUBLIC">Public — discoverable in /jobseekers listings</option>
        </Select>
      </Field>

      {error && (
        <p role="alert" className="m-0 text-danger">
          {error}
        </p>
      )}
      {saved && <p className="m-0 text-success">Saved.</p>}

      {/* Not gated on isDirty: a disabled Save gives no hint what to change and
          drops out of the tab order. Saving unchanged data is harmless. */}
      <Button type="submit" loading={isPending} className="self-start">
        {isPending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}
