'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { saveProfile } from '@/app/actions/profile';
import { Field, Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';

const ProfileFormSchema = z.object({
  headline: z.string().max(140).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  yearsExperience: z.coerce.number().int().min(0).max(70).nullable(),
  location: z.string().max(140).optional().or(z.literal('')),
  desiredSalaryMin: z.coerce.number().int().min(0).nullable(),
  desiredSalaryMax: z.coerce.number().int().min(0).nullable(),
  desiredWorkMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export function ProfileForm({ initial }: { initial: ProfileFormValues }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: initial,
  });

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
      <Field label="Headline" error={errors.headline?.message}>
        <Input {...register('headline')} placeholder="Senior Backend Engineer · Berlin" />
      </Field>

      <Field label="Bio" error={errors.bio?.message}>
        <Textarea {...register('bio')} rows={6} placeholder="A short summary of what you do and what you're looking for." />
      </Field>

      <Field label="Years of professional experience" error={errors.yearsExperience?.message}>
        <Input type="number" {...register('yearsExperience')} min={0} max={70} />
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
