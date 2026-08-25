'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { JobPostStatus } from '@prisma/client';
import { Checkbox, Input, Select, Textarea } from '@/app/components/ui/form';
import { SheetField, SheetGroup, SheetGroups, SheetTitle } from '@/app/components/console/sheet';
import { Notebook } from '@/app/components/console/notebook';
import { Statusbar, type Stage } from '@/app/components/console/statusbar';
import { JOB_STATUS_LABEL } from './job-status';
import { INDUSTRIES, type PostJobFormValues } from './job-form-schema';

// Shared job form fields, used by both the create (/company/jobs/new) and edit
// (/company/jobs/[id]/edit) forms so they can't drift. The schema lives in
// ./job-form-schema so the server actions can import it across the RSC boundary.
//
// Laid out as an Odoo form sheet rather than one long column: the title and
// status pipeline at the top, classification and compensation as two columns of
// label:value rows, and the three long-form blocks (description, requirements,
// options) behind notebook tabs. Same fields, same schema, ~a third of the
// height — the previous single stack put the submit button four screens below
// the title field.

export function JobFormFields({
  register,
  errors,
  publish,
  onPublishChange,
  status,
}: {
  register: UseFormRegister<PostJobFormValues>;
  errors: FieldErrors<PostJobFormValues>;
  /** Current value of the `publish` field — drives the statusbar. */
  publish: boolean;
  onPublishChange: (publish: boolean) => void;
  /** Persisted status, on the edit form. Absent when creating. */
  status?: JobPostStatus;
}) {
  return (
    <>
      <SheetTitle
        title={
          <SheetField label="Title" error={errors.title?.message} required wide>
            <Input
              {...register('title')}
              placeholder="Senior Backend Engineer"
              className="text-base font-semibold"
            />
          </SheetField>
        }
        aside={<JobStatusbar publish={publish} onPublishChange={onPublishChange} status={status} />}
      />

      <SheetGroups>
        <SheetGroup title="Classification">
          <SheetField label="Industry" error={errors.industry?.message}>
            <Select {...register('industry')}>
              {INDUSTRIES.map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0) + v.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </SheetField>
          <SheetField label="Job type" error={errors.jobType?.message}>
            <Select {...register('jobType')}>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="TEMPORARY">Temporary</option>
            </Select>
          </SheetField>
          <SheetField label="Experience level">
            <Select {...register('experienceLevel')}>
              <option value="ENTRY">Entry</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
              <option value="STAFF">Staff</option>
              <option value="EXECUTIVE">Executive</option>
            </Select>
          </SheetField>
          <SheetField label="Work mode">
            <Select {...register('workMode')}>
              <option value="ONSITE">On-site</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </Select>
          </SheetField>
        </SheetGroup>

        <SheetGroup title="Location & compensation">
          <SheetField label="Location">
            <Input {...register('location')} placeholder="Berlin, DE" />
          </SheetField>
          <SheetField label="Salary range" hint="Leave blank to omit from the posting.">
            <span className="grid grid-cols-[1fr_1fr_4.5rem] gap-1.5">
              <Input
                type="number"
                {...register('salaryMin')}
                aria-label="Salary minimum"
                placeholder="Min"
              />
              <Input
                type="number"
                {...register('salaryMax')}
                aria-label="Salary maximum"
                placeholder="Max"
              />
              <Input
                {...register('salaryCurrency')}
                maxLength={3}
                aria-label="Salary currency"
                className="uppercase"
              />
            </span>
          </SheetField>
          <SheetField label="Deadline">
            <Input type="date" {...register('applicationDeadline')} />
          </SheetField>
        </SheetGroup>
      </SheetGroups>

      <Notebook
        tabs={[
          {
            id: 'description',
            label: 'Description',
            content: (
              <SheetField label="Description" error={errors.description?.message} required wide>
                <Textarea
                  {...register('description')}
                  rows={12}
                  placeholder="The role, the team, what success looks like."
                />
              </SheetField>
            ),
          },
          {
            id: 'requirements',
            label: 'Requirements',
            content: (
              <SheetField label="Requirements" error={errors.requirements?.message} required wide>
                <Textarea
                  {...register('requirements')}
                  rows={10}
                  placeholder="Must-haves and nice-to-haves."
                />
              </SheetField>
            ),
          },
          {
            id: 'options',
            label: 'Options',
            content: (
              <div className="flex flex-col gap-3">
                <Checkbox
                  {...register('createChatArea')}
                  label="Create a job-specific chat area (shortlisted applicants join it automatically)"
                />
                <p className="text-fg-subtle text-[12px]">
                  Required skills are extracted from the description by AI on save, and drive
                  seekers’ match scores.
                </p>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}

/**
 * The status pipeline, doubling as the publish control — which is what a
 * statusbar is for. It replaces a checkbox labelled "Published (uncheck to move
 * to draft)", a control whose effect you had to read to understand.
 *
 * Only Draft and Published are clickable because they are the only two states
 * this form can actually reach: `publish` is a boolean and the server action
 * maps it to exactly `PUBLISHED` or `DRAFT`. A record sitting in any other state
 * gets that state appended as a read-only stage, so the bar never implies the
 * form can put it back there.
 */
function JobStatusbar({
  publish,
  onPublishChange,
  status,
}: {
  publish: boolean;
  onPublishChange: (publish: boolean) => void;
  status?: JobPostStatus;
}) {
  const controllable: Stage[] = [
    { key: 'DRAFT', label: JOB_STATUS_LABEL.DRAFT, tone: 'neutral' },
    { key: 'PUBLISHED', label: JOB_STATUS_LABEL.PUBLISHED, tone: 'success' },
  ];
  const isOther = status !== undefined && status !== 'DRAFT' && status !== 'PUBLISHED';
  const stages: Stage[] = isOther
    ? [
        ...controllable,
        {
          key: status,
          label: JOB_STATUS_LABEL[status],
          tone: status === 'PENDING_REVIEW' ? 'warn' : 'neutral',
        },
      ]
    : controllable;

  return (
    <Statusbar
      label="Publication status"
      stages={stages}
      // While the record is in a state this form can't set, the bar shows that
      // state as current; saving will move it to Draft or Published per the
      // checkbox-equivalent below.
      current={isOther ? status : publish ? 'PUBLISHED' : 'DRAFT'}
      onSelect={(key) => {
        if (key === 'DRAFT') onPublishChange(false);
        if (key === 'PUBLISHED') onPublishChange(true);
      }}
    />
  );
}
