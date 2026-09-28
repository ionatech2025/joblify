'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { saveProfile } from '@/app/actions/profile';
import { Field, Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';
import { useProfileDraftStore } from '@/lib/stores/profile-draft';
import { useFormDraft } from '@/lib/use-form-draft';
import { toast } from '@/lib/stores/ui';

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
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 numeric digits')
      .optional()
      .or(z.literal('')),
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
    skillSlugs: z.array(z.string()).max(30).default([]),
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
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: initial,
  });

  const isVirtualIntern = useWatch({ control, name: 'profileType' }) === 'VIRTUAL_INTERN';

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
          message = 'Please check that all required fields (Bio, Education, and Skills) are filled in properly.';
        }
        setError(message);
        toast.error("Couldn't save your profile", message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
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

      <Field label="Bio *" error={errors.bio?.message}>
        <Textarea
          {...register('bio')}
          rows={6}
          placeholder="A short summary of what you do and what you're looking for."
        />
      </Field>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-fg-muted">
          Skills {isVirtualIntern ? '(optional)' : '*(at least 1 required)'}
        </legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-control border border-border-strong bg-surface p-3 sm:grid-cols-3">
          {allSkills.map((skill) => (
            <label key={skill.slug} className="flex items-center gap-2 text-sm text-fg-muted">
              <input type="checkbox" value={skill.slug} {...register('skillSlugs')} />
              {skill.label}
            </label>
          ))}
        </div>
        {errors.skillSlugs?.message && (
          <span className="text-sm text-danger">{errors.skillSlugs.message}</span>
        )}
      </fieldset>

      <Field label="Years of professional experience" error={errors.yearsExperience?.message}>
        <Input type="number" {...register('yearsExperience')} min={0} max={70} />
      </Field>

      <Field label="Education *" error={errors.education?.message}>
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
          hint="Optional 10-digit mobile number"
          error={errors.phone?.message}
        >
          <Input
            type="tel"
            {...register('phone')}
            autoComplete="tel"
            placeholder="0743535678"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Desired min salary (annual)" error={errors.desiredSalaryMin?.message}>
          <Input type="number" {...register('desiredSalaryMin')} />
        </Field>
        <Field label="Desired max salary (annual)" error={errors.desiredSalaryMax?.message}>
          <Input type="number" {...register('desiredSalaryMax')} />
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

      {error && <p className="m-0 text-danger">{error}</p>}
      {saved && <p className="m-0 text-success">Saved.</p>}

      <Button type="submit" disabled={isPending || !isDirty} className="self-start">
        {isPending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}
