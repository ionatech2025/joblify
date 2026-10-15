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
import { FormSheet, SheetTitle } from '@/app/components/console/sheet';
import { useHydrated } from '@/lib/use-hydrated';
import { toast } from '@/lib/stores/ui';
import { endsBeforeStart } from '@/lib/resume/date-order';

const EntrySchema = z
  .object({
    company: z.string().trim().min(1, 'Company is required').max(200),
    title: z.string().trim().min(1, 'Title is required').max(200),
    startDate: z.string().max(40).optional().or(z.literal('')),
    endDate: z.string().max(40).optional().or(z.literal('')),
    description: z.string().max(1000).optional().or(z.literal('')),
  })
  // Dates are free text on purpose (parsed résumés give "2021", "Jan 2022",
  // "Summer 2019", "Present"), so they are not rejected for their shape. The one
  // thing that is checkable whatever the spelling is the order of the years.
  .refine((e) => !endsBeforeStart(e.startDate, e.endDate), {
    path: ['endDate'],
    message: 'The end date is before the start date.',
  });
const FormSchema = z.object({ entries: z.array(EntrySchema).max(20) });
type FormValues = z.infer<typeof FormSchema>;

const EMPTY_ENTRY = { company: '', title: '', startDate: '', endDate: '', description: '' };

export function ResumeBuilderForm({ initialEntries }: { initialEntries: FormValues['entries'] }) {
  const hydrated = useHydrated();
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
        toast.success('Work experience saved');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Save failed.';
        setError(message);
        toast.error("Couldn't save", message);
      }
    });
  }

  function onGenerate() {
    setError(null);
    setResumeUrl(null);
    startGenerating(async () => {
      try {
        const resume = await generateResume();
        // The authenticated download route — generated PDFs are private too.
        setResumeUrl(`/api/v1/resumes/${resume.id}/file`);
        toast.success('Resume generated', 'Your PDF is ready.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not generate a resume.';
        setError(message);
        toast.error("Couldn't generate resume", message);
      }
    });
  }

  return (
    <FormSheet>
      <SheetTitle
        title="Resume builder"
        subtitle={
          <>
            Your headline, bio, skills, education, and certifications come from{' '}
            <Link href="/jobseeker/profile" className="text-brand underline">
              your profile
            </Link>
            . Add work history below, then generate a PDF.
          </>
        }
      />

      <form onSubmit={handleSubmit(onSave)} noValidate className="flex flex-col gap-4">
        <fieldset disabled={!hydrated} className="m-0 contents border-0 p-0">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-soft"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Company" required error={errors.entries?.[index]?.company?.message}>
                  <Input
                    defaultValue={field.company}
                    {...register(`entries.${index}.company`)}
                    autoComplete="organization"
                    placeholder="Acme Inc."
                  />
                </Field>
                <Field label="Title" required error={errors.entries?.[index]?.title?.message}>
                  <Input
                    defaultValue={field.title}
                    {...register(`entries.${index}.title`)}
                    autoComplete="organization-title"
                    placeholder="Software Engineer"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Start date"
                  hint="A month and year, or just a year — e.g. Jan 2022"
                  error={errors.entries?.[index]?.startDate?.message}
                >
                  <Input
                    defaultValue={field.startDate}
                    {...register(`entries.${index}.startDate`)}
                    autoComplete="off"
                    placeholder="Jan 2022"
                  />
                </Field>
                <Field
                  label="End date"
                  hint="Write Present if you still work here"
                  error={errors.entries?.[index]?.endDate?.message}
                >
                  <Input
                    defaultValue={field.endDate}
                    {...register(`entries.${index}.endDate`)}
                    autoComplete="off"
                    placeholder="Present"
                  />
                </Field>
              </div>
              <Field label="Description" error={errors.entries?.[index]?.description?.message}>
                <Textarea
                  defaultValue={field.description}
                  {...register(`entries.${index}.description`)}
                  rows={3}
                  placeholder="What did you do?"
                />
              </Field>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="self-start"
                onClick={() => remove(index)}
              >
                Remove
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => append(EMPTY_ENTRY)}
          >
            + Add work experience
          </Button>

          {error && (
            <p role="alert" className="m-0 text-danger">
              {error}
            </p>
          )}
          {saved && <p className="m-0 text-success">Saved.</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={isSaving} disabled={!isDirty}>
              {isSaving ? 'Saving…' : 'Save work experience'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={isGenerating}
              disabled={isDirty}
              title={isDirty ? 'Save your changes first' : undefined}
              onClick={onGenerate}
            >
              {isGenerating ? 'Generating…' : 'Generate resume PDF'}
            </Button>
          </div>

          {resumeUrl && (
            <p className="m-0 text-success">
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
        </fieldset>
      </form>
    </FormSheet>
  );
}
