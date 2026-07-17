'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveWorkExperiences } from '@/app/actions/work-experience';
import { generateResume } from '@/app/actions/generate-resume';
import { Field, Input, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';

const EntrySchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(200),
  title: z.string().trim().min(1, 'Title is required').max(200),
  startDate: z.string().max(40).optional().or(z.literal('')),
  endDate: z.string().max(40).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
});
const FormSchema = z.object({ entries: z.array(EntrySchema).max(20) });
type FormValues = z.infer<typeof FormSchema>;

const EMPTY_ENTRY = { company: '', title: '', startDate: '', endDate: '', description: '' };

export function ResumeBuilderForm({ initialEntries }: { initialEntries: FormValues['entries'] }) {
  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { entries: initialEntries.length > 0 ? initialEntries : [EMPTY_ENTRY] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'entries' });

  function onSave(values: FormValues) {
    setError(null);
    setSaved(false);
    startSaving(async () => {
      try {
        await saveWorkExperiences(values.entries.filter((e) => e.company.trim() || e.title.trim()));
        // Re-baseline dirty-tracking against what was just saved — otherwise
        // isDirty stays permanently true for the rest of the session and
        // "Generate resume PDF" never re-enables.
        reset(values, { keepValues: true });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed.');
      }
    });
  }

  function onGenerate() {
    setError(null);
    setResumeUrl(null);
    startGenerating(async () => {
      try {
        const resume = await generateResume();
        setResumeUrl(resume.fileBlobUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not generate a resume.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="m-0 text-sm text-neutral-600">
        Your headline, bio, skills, education, and certifications come from{' '}
        <Link href="/jobseeker/profile" className="text-indigo-600 hover:underline">
          your profile
        </Link>
        . Add work history below, then generate a PDF.
      </p>

      <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Company" error={errors.entries?.[index]?.company?.message}>
                <Input {...register(`entries.${index}.company`)} placeholder="Acme Inc." />
              </Field>
              <Field label="Title" error={errors.entries?.[index]?.title?.message}>
                <Input {...register(`entries.${index}.title`)} placeholder="Software Engineer" />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Start date" error={errors.entries?.[index]?.startDate?.message}>
                <Input {...register(`entries.${index}.startDate`)} placeholder="Jan 2022" />
              </Field>
              <Field label="End date" error={errors.entries?.[index]?.endDate?.message}>
                <Input {...register(`entries.${index}.endDate`)} placeholder="Present" />
              </Field>
            </div>
            <Field label="Description" error={errors.entries?.[index]?.description?.message}>
              <Textarea {...register(`entries.${index}.description`)} rows={3} placeholder="What did you do?" />
            </Field>
            <Button type="button" variant="danger" size="sm" className="self-start" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}

        <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => append(EMPTY_ENTRY)}>
          + Add work experience
        </Button>

        {error && <p className="m-0 text-red-700">{error}</p>}
        {saved && <p className="m-0 text-green-700">Saved.</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving ? 'Saving…' : 'Save work experience'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isGenerating || isDirty}
            title={isDirty ? 'Save your changes first' : undefined}
            onClick={onGenerate}
          >
            {isGenerating ? 'Generating…' : 'Generate resume PDF'}
          </Button>
        </div>

        {resumeUrl && (
          <p className="m-0 text-green-700">
            Resume ready —{' '}
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="underline">
              open it
            </a>
            , or find it anytime in{' '}
            <Link href="/jobseeker/resumes" className="underline">
              My resumes
            </Link>
            .
          </p>
        )}
      </form>
    </div>
  );
}
