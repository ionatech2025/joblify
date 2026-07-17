'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { saveProfile } from '@/app/actions/profile';
import { Field, Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';

const ProfileFormSchema = z.object({
  profileType: z.enum(['EMPLOYABLE', 'VIRTUAL_INTERN']),
  headline: z.string().max(140).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  yearsExperience: z.coerce.number().int().min(0).max(70).nullable(),
  location: z.string().max(140).optional().or(z.literal('')),
  desiredSalaryMin: z.coerce.number().int().min(0).nullable(),
  desiredSalaryMax: z.coerce.number().int().min(0).nullable(),
  desiredWorkMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  careerInterest: z.string().max(140).optional().or(z.literal('')),
  availabilityHoursPerWeek: z.coerce.number().int().min(1).max(80).nullable(),
  learningGoal: z.string().max(500).optional().or(z.literal('')),
  education: z.string().max(1000).optional().or(z.literal('')),
  certifications: z.string().max(1000).optional().or(z.literal('')),
  portfolioUrl: z.string().trim().url().max(300).optional().or(z.literal('')),
  skillSlugs: z.array(z.string()).max(30).default([]),
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: initial,
  });

  const isVirtualIntern = useWatch({ control, name: 'profileType' }) === 'VIRTUAL_INTERN';

  function onSubmit(values: ProfileFormValues) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveProfile(values);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed.');
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
        <div className="flex flex-col gap-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
          <Field label="Career interest" error={errors.careerInterest?.message}>
            <Input {...register('careerInterest')} placeholder="Digital marketing" />
          </Field>
          <Field label="Availability (hours per week)" error={errors.availabilityHoursPerWeek?.message}>
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
        <Input {...register('headline')} placeholder="Senior Backend Engineer · Berlin" />
      </Field>

      <Field label="Bio" error={errors.bio?.message}>
        <Textarea {...register('bio')} rows={6} placeholder="A short summary of what you do and what you're looking for." />
      </Field>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-neutral-700">Skills</legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-neutral-300 p-3 sm:grid-cols-3">
          {allSkills.map((skill) => (
            <label key={skill.slug} className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" value={skill.slug} {...register('skillSlugs')} />
              {skill.label}
            </label>
          ))}
        </div>
        {errors.skillSlugs?.message && <span className="text-sm text-red-600">{errors.skillSlugs.message}</span>}
      </fieldset>

      <Field label="Years of professional experience" error={errors.yearsExperience?.message}>
        <Input type="number" {...register('yearsExperience')} min={0} max={70} />
      </Field>

      <Field label="Education" error={errors.education?.message}>
        <Textarea {...register('education')} rows={3} placeholder="B.Sc. Computer Science, University of Nairobi (2018–2022)" />
      </Field>

      <Field label="Certifications" error={errors.certifications?.message}>
        <Textarea {...register('certifications')} rows={3} placeholder="AWS Certified Solutions Architect (2024)" />
      </Field>

      <Field label="Portfolio / GitHub link" error={errors.portfolioUrl?.message}>
        <Input {...register('portfolioUrl')} placeholder="https://github.com/yourname" />
      </Field>

      <Field label="Location" error={errors.location?.message}>
        <Input {...register('location')} placeholder="Berlin, DE" />
      </Field>

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

      {error && <p className="m-0 text-red-700">{error}</p>}
      {saved && <p className="m-0 text-green-700">Saved.</p>}

      <Button type="submit" disabled={isPending || !isDirty} className="self-start">
        {isPending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}
