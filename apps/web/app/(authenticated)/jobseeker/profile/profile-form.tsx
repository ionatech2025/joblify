'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useState, useTransition } from 'react';
import { saveProfile } from '@/app/actions/profile';
import { StrictProfileSchema } from '@/app/actions/profile-schema';
import { Checkbox, Input, Select, Textarea } from '@/app/components/ui/form';
import {
  FormSheet,
  SheetField,
  SheetGroup,
  SheetGroups,
  SheetTitle,
} from '@/app/components/console/sheet';
import { DirtyBar } from '@/app/components/console/dirty-bar';
import { useProfileDraftStore } from '@/lib/stores/profile-draft';
import { useFormDraft } from '@/lib/use-form-draft';
import { useHydrated } from '@/lib/use-hydrated';
import { toast } from '@/lib/stores/ui';

export type ProfileFormValues = z.infer<typeof StrictProfileSchema>;

export function ProfileForm({
  initial,
  allSkills,
}: {
  initial: ProfileFormValues;
  allSkills: Array<{ slug: string; label: string }>;
}) {
  const hydrated = useHydrated();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
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
    resolver: zodResolver(StrictProfileSchema),
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
  useFormDraft({
    store: useProfileDraftStore,
    watch,
    reset,
    initial,
    onRestore: () => setRestoredDraft(true),
  });

  function onSubmit(values: ProfileFormValues) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveProfile(values);
        setSaved(true);
        clearDraft();
        setRestoredDraft(false);
        reset(values);
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset disabled={!hydrated} className="m-0 contents border-0 p-0">
        <FormSheet>
          <SheetTitle
            title="Jobseeker profile"
            subtitle="These fields show up to recruiters when you apply. Keep your headline and skills current."
          />

          <SheetGroups>
            <SheetGroup title="Identity & contact">
              <SheetField label="Profile type" error={errors.profileType?.message}>
                <Select defaultValue={initial.profileType} {...register('profileType')}>
                  <option value="EMPLOYABLE">Employable — looking for a role</option>
                  <option value="VIRTUAL_INTERN">Virtual intern — looking for experience</option>
                </Select>
              </SheetField>
              <SheetField label="Headline" error={errors.headline?.message}>
                <Input
                  defaultValue={initial.headline ?? ''}
                  {...register('headline')}
                  autoComplete="organization-title"
                  placeholder="Senior Backend Engineer · Berlin"
                />
              </SheetField>
              <SheetField label="Location" error={errors.location?.message}>
                <Input
                  defaultValue={initial.location ?? ''}
                  {...register('location')}
                  autoComplete="address-level2"
                  placeholder="Berlin, DE"
                />
              </SheetField>
              <SheetField
                label="Phone number"
                hint="Optional. Add the country code for an international number, e.g. +256 743 535 678"
                error={errors.phone?.message}
              >
                <Input
                  type="tel"
                  defaultValue={initial.phone ?? ''}
                  {...register('phone')}
                  autoComplete="tel"
                  placeholder="+256 743 535 678"
                />
              </SheetField>
              <SheetField label="Portfolio / GitHub link" error={errors.portfolioUrl?.message}>
                <Input
                  type="url"
                  defaultValue={initial.portfolioUrl ?? ''}
                  {...register('portfolioUrl')}
                  autoComplete="url"
                  placeholder="https://github.com/yourname"
                />
              </SheetField>
            </SheetGroup>

            <SheetGroup title="Preferences & experience">
              <SheetField label="Profile visibility" error={errors.visibility?.message}>
                <Select defaultValue={initial.visibility} {...register('visibility')}>
                  <option value="PRIVATE">Private — only visible to companies I apply to</option>
                  <option value="PUBLIC">Public — discoverable in /jobseekers listings</option>
                </Select>
              </SheetField>
              <SheetField label="Preferred work mode" error={errors.desiredWorkMode?.message}>
                <Select
                  defaultValue={initial.desiredWorkMode ?? ''}
                  {...register('desiredWorkMode')}
                >
                  <option value="">No preference</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </Select>
              </SheetField>
              <SheetField
                label="Years of professional experience"
                error={errors.yearsExperience?.message}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  defaultValue={initial.yearsExperience ?? ''}
                  {...register('yearsExperience')}
                  min={0}
                  max={70}
                />
              </SheetField>
              <SheetField
                label="Desired min salary (annual)"
                error={errors.desiredSalaryMin?.message}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  defaultValue={initial.desiredSalaryMin ?? ''}
                  {...register('desiredSalaryMin')}
                />
              </SheetField>
              <SheetField
                label="Desired max salary (annual)"
                error={errors.desiredSalaryMax?.message}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  defaultValue={initial.desiredSalaryMax ?? ''}
                  {...register('desiredSalaryMax')}
                />
              </SheetField>
            </SheetGroup>

            {isVirtualIntern && (
              <SheetGroup title="Virtual internship details" wide>
                <div className="flex flex-col gap-3 rounded-card border border-border bg-brand-subtle p-4">
                  <SheetField label="Career interest" error={errors.careerInterest?.message}>
                    <Input
                      defaultValue={initial.careerInterest ?? ''}
                      {...register('careerInterest')}
                      placeholder="Digital marketing"
                    />
                  </SheetField>
                  <SheetField
                    label="Availability (hours per week)"
                    error={errors.availabilityHoursPerWeek?.message}
                  >
                    <Input
                      type="number"
                      defaultValue={initial.availabilityHoursPerWeek ?? ''}
                      {...register('availabilityHoursPerWeek')}
                      min={1}
                      max={80}
                    />
                  </SheetField>
                  <SheetField label="Learning goal" error={errors.learningGoal?.message} wide>
                    <Textarea
                      defaultValue={initial.learningGoal ?? ''}
                      {...register('learningGoal')}
                      rows={3}
                      placeholder="What do you want to get out of a virtual internship?"
                    />
                  </SheetField>
                </div>
              </SheetGroup>
            )}

            <SheetGroup title="Summary & academic background" wide>
              <SheetField label="Bio" required error={errors.bio?.message} wide>
                <Textarea
                  defaultValue={initial.bio ?? ''}
                  {...register('bio')}
                  rows={6}
                  placeholder="A short summary of what you do and what you're looking for."
                />
              </SheetField>

              <SheetField label="Education" required error={errors.education?.message} wide>
                <Textarea
                  defaultValue={initial.education ?? ''}
                  {...register('education')}
                  rows={3}
                  placeholder="B.Sc. Computer Science, University of Nairobi (2018–2022)"
                />
              </SheetField>

              <SheetField label="Certifications" error={errors.certifications?.message} wide>
                <Textarea
                  defaultValue={initial.certifications ?? ''}
                  {...register('certifications')}
                  rows={3}
                  placeholder="AWS Certified Solutions Architect (2024)"
                />
              </SheetField>
            </SheetGroup>

            <SheetGroup title="Skills" wide>
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
                      defaultChecked={initial.skillSlugs.includes(skill.slug)}
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
            </SheetGroup>
          </SheetGroups>

          {error && (
            <p role="alert" className="mt-4 m-0 text-danger">
              {error}
            </p>
          )}
          {saved && <p className="mt-4 m-0 text-success">Saved.</p>}

          <DirtyBar
            dirty={isDirty || restoredDraft}
            saving={isPending}
            onDiscard={() => {
              clearDraft();
              reset(initial);
              setRestoredDraft(false);
            }}
            saveLabel="Save profile"
            savingLabel="Saving…"
          />
        </FormSheet>
      </fieldset>
    </form>
  );
}
