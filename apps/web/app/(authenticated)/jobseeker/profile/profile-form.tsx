'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { saveProfile } from '@/app/actions/profile';

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}
    >
      <Field label="Headline" error={errors.headline?.message}>
        <input {...register('headline')} placeholder="Senior Backend Engineer · Berlin" style={input} />
      </Field>

      <Field label="Bio" error={errors.bio?.message}>
        <textarea {...register('bio')} rows={6} placeholder="A short summary of what you do and what you're looking for." style={input} />
      </Field>

      <Field label="Years of professional experience" error={errors.yearsExperience?.message}>
        <input type="number" {...register('yearsExperience')} min={0} max={70} style={input} />
      </Field>

      <Field label="Location" error={errors.location?.message}>
        <input {...register('location')} placeholder="Berlin, DE" style={input} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Desired min salary (annual)" error={errors.desiredSalaryMin?.message}>
          <input type="number" {...register('desiredSalaryMin')} style={input} />
        </Field>
        <Field label="Desired max salary (annual)" error={errors.desiredSalaryMax?.message}>
          <input type="number" {...register('desiredSalaryMax')} style={input} />
        </Field>
      </div>

      <Field label="Preferred work mode" error={errors.desiredWorkMode?.message}>
        <select {...register('desiredWorkMode')} style={input}>
          <option value="">No preference</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-site</option>
        </select>
      </Field>

      <Field label="Profile visibility" error={errors.visibility?.message}>
        <select {...register('visibility')} style={input}>
          <option value="PRIVATE">Private — only visible to companies I apply to</option>
          <option value="PUBLIC">Public — discoverable in /jobseekers listings</option>
        </select>
      </Field>

      {error && <p style={{ color: '#a00', margin: 0 }}>{error}</p>}
      {saved && <p style={{ color: '#114411', margin: 0 }}>Saved.</p>}

      <button
        type="submit"
        disabled={isPending || !isDirty}
        style={{
          padding: '0.75rem 1.25rem',
          background: isDirty ? '#111' : '#ccc',
          color: 'white',
          borderRadius: 8,
          border: 0,
          fontWeight: 600,
          cursor: isDirty ? 'pointer' : 'not-allowed',
        }}
      >
        {isPending ? 'Saving…' : 'Save profile'}
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
