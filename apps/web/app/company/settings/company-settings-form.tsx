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
import { Field, Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';

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
    <div className="mt-6">
      <section className="mb-6 flex items-center gap-4 border-b border-border pb-6">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied logo, no fixed dims
          <img
            src={logo}
            alt="Company logo"
            width={64}
            height={64}
            className="size-16 rounded-control object-cover"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-control bg-surface-sunken text-sm text-fg-subtle">
            Logo
          </div>
        )}
        <input
          ref={logoInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onLogo}
          className="hidden"
          aria-hidden="true"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => logoInput.current?.click()}
          disabled={logoBusy}
        >
          {logoBusy ? 'Uploading…' : 'Upload logo'}
        </Button>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Company name" error={errors.companyName?.message}>
          <Input {...register('companyName')} />
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
          <Textarea {...register('description')} rows={5} />
        </Field>

        <Field label="Website" error={errors.website?.message}>
          <Input {...register('website')} placeholder="https://acme.com" />
        </Field>

        <Field label="LinkedIn" error={errors.linkedin?.message}>
          <Input {...register('linkedin')} placeholder="https://linkedin.com/company/acme" />
        </Field>

        {error && <p className="m-0 text-danger">{error}</p>}
        {saved && <p className="m-0 text-success">Saved.</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
