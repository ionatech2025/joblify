'use client';

import { useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import {
  CompanyProfileSchema,
  type CompanyProfileInput,
  INDUSTRY_OPTIONS,
  SIZE_VALUES,
  SIZE_LABELS,
} from '@/app/company/company-profile-schema';
import { updateCompanyProfile } from '@/app/actions/company';
import { registerLogo } from '@/app/actions/uploads';

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.35rem' };
const control: React.CSSProperties = { padding: '0.6rem', border: '1px solid #ccc', borderRadius: 6 };

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function CompanySettingsForm({
  userId,
  initial,
  logoUrl,
}: {
  userId: string;
  initial: CompanyProfileInput;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(logoUrl);
  const [logoBusy, setLogoBusy] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyProfileInput>({
    resolver: zodResolver(CompanyProfileSchema),
    defaultValues: initial,
  });

  function onSubmit(values: CompanyProfileInput) {
    setError(null);
    setSaved(false);
    start(async () => {
      try {
        await updateCompanyProfile(values);
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save. Try again.');
      }
    });
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (logoInput.current) logoInput.current.value = '';
    if (!file) return;
    setError(null);
    setLogoBusy(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await upload(`logos/${userId}/${safe}`, file, {
        access: 'public',
        handleUploadUrl: '/api/v1/uploads/sign',
        clientPayload: JSON.stringify({ kind: 'logo' }),
      });
      await registerLogo({ url: blob.url });
      setLogo(blob.url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo upload failed. Use a PNG/JPG under 2MB.');
    } finally {
      setLogoBusy(false);
    }
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #eee',
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied logo, no fixed dims
          <img src={logo} alt="Company logo" width={64} height={64} style={{ borderRadius: 8, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f1f1f1', display: 'grid', placeItems: 'center', color: '#aaa' }}>
            Logo
          </div>
        )}
        <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogo} style={{ display: 'none' }} aria-hidden="true" />
        <button
          type="button"
          onClick={() => logoInput.current?.click()}
          disabled={logoBusy}
          style={{ padding: '0.5rem 0.9rem', border: '1px solid #ccc', background: '#fff', borderRadius: 6, cursor: logoBusy ? 'wait' : 'pointer' }}
        >
          {logoBusy ? 'Uploading…' : 'Upload logo'}
        </button>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={field}>
          <span>Company name</span>
          <input {...register('companyName')} style={control} />
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
          <textarea {...register('description')} rows={5} style={control} />
          {errors.description && <small style={{ color: '#a00' }}>{errors.description.message}</small>}
        </label>

        <label style={field}>
          <span>Website</span>
          <input {...register('website')} style={control} placeholder="https://acme.com" />
          {errors.website && <small style={{ color: '#a00' }}>{errors.website.message}</small>}
        </label>

        <label style={field}>
          <span>LinkedIn</span>
          <input {...register('linkedin')} style={control} placeholder="https://linkedin.com/company/acme" />
          {errors.linkedin && <small style={{ color: '#a00' }}>{errors.linkedin.message}</small>}
        </label>

        {error && <p style={{ color: '#a00', margin: 0 }}>{error}</p>}
        {saved && <p style={{ color: '#137333', margin: 0 }}>Saved.</p>}

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
            alignSelf: 'flex-start',
          }}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
