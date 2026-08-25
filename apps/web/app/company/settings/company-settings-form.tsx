'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';
import {
  FormSheet,
  SheetField,
  SheetGroup,
  SheetGroups,
  SheetTitle,
} from '@/app/components/console/sheet';
import { DirtyBar } from '@/app/components/console/dirty-bar';
import { useCompanySettingsDraftStore } from '@/lib/stores/company-settings-draft';
import { toast } from '@/lib/stores/ui';

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
  const [error, setError] = useState<string | null>(null);
  // A restored draft is unsaved work; reset() rebases RHF's dirty baseline, so
  // the dirty bar needs to be told separately.
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [logo, setLogo] = useState<string | null>(logoUrl);
  const [logoBusy, setLogoBusy] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const draftStore = useCompanySettingsDraftStore();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyProfileInput>({
    resolver: zodResolver(CompanyProfileSchema),
    defaultValues: initial,
  });

  // Restore a saved draft once on mount (draft wins over the server-loaded
  // profile for any field it has a value for). An empty draft is a no-op.
  // (Logo upload is a separate useState-managed flow, not part of this draft.)
  useEffect(() => {
    if (Object.keys(draftStore.draft).length > 0) {
      reset({ ...initial, ...draftStore.draft });
      setRestoredDraft(true);
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
        await updateCompanyProfile(values);
        draftStore.clear();
        setRestoredDraft(false);
        // Rebase the dirty baseline onto what was just saved, so the bar reads
        // "All changes saved" rather than staying dirty until a reload.
        reset(values);
        router.refresh();
        toast.success('Company profile saved');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not save. Try again.';
        setError(message);
        toast.error("Couldn't save", message);
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
      toast.success('Logo updated');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Logo upload failed. Use a PNG/JPG under 2MB.';
      setError(message);
      toast.error('Logo upload failed', message);
    } finally {
      setLogoBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSheet>
        <SheetTitle
          title="Company profile"
          subtitle="This is what jobseekers see on your company page and job posts."
          aside={
            <div className="flex items-center gap-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-supplied logo, no fixed dims
                <img
                  src={logo}
                  alt="Company logo"
                  width={48}
                  height={48}
                  className="rounded-control border-border size-12 border object-cover"
                />
              ) : (
                <div className="rounded-control bg-surface-sunken text-fg-subtle border-border grid size-12 place-items-center border text-[11px]">
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
                size="sm"
                onClick={() => logoInput.current?.click()}
                disabled={logoBusy}
                loading={logoBusy}
              >
                {logoBusy ? 'Uploading…' : 'Upload logo'}
              </Button>
            </div>
          }
        />

        <SheetGroups>
          <SheetGroup title="Identity">
            <SheetField label="Company name" error={errors.companyName?.message} required>
              <Input {...register('companyName')} />
            </SheetField>
            <SheetField label="Industry">
              <Select {...register('industry')}>
                {INDUSTRY_OPTIONS.map((i) => (
                  <option key={i} value={i}>
                    {titleCase(i)}
                  </option>
                ))}
              </Select>
            </SheetField>
            <SheetField label="Company size">
              <Select {...register('companySize')}>
                {SIZE_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {SIZE_LABELS[s]}
                  </option>
                ))}
              </Select>
            </SheetField>
          </SheetGroup>

          <SheetGroup title="Links">
            <SheetField label="Website" error={errors.website?.message}>
              <Input {...register('website')} placeholder="https://acme.com" />
            </SheetField>
            <SheetField label="LinkedIn" error={errors.linkedin?.message}>
              <Input {...register('linkedin')} placeholder="https://linkedin.com/company/acme" />
            </SheetField>
          </SheetGroup>

          <SheetGroup title="About" wide>
            <SheetField label="About the company" error={errors.description?.message} wide>
              <Textarea {...register('description')} rows={6} />
            </SheetField>
          </SheetGroup>
        </SheetGroups>

        {error && (
          <p role="alert" className="text-danger mt-4 text-[13px]">
            {error}
          </p>
        )}

        <DirtyBar
          dirty={isDirty || restoredDraft}
          saving={pending}
          onDiscard={() => {
            draftStore.clear();
            reset(initial);
            setRestoredDraft(false);
          }}
          saveLabel="Save changes"
        />
      </FormSheet>
    </form>
  );
}
