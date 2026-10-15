'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { JobPostStatus } from '@prisma/client';
import { Checkbox, Input, Select, Textarea } from '@/app/components/ui/form';
import { SheetField, SheetGroup, SheetGroups, SheetTitle } from '@/app/components/console/sheet';
import { Notebook } from '@/app/components/console/notebook';
import { Statusbar, type Stage } from '@/app/components/console/statusbar';
import { JOB_STATUS_LABEL } from './job-status';
import {
  INDUSTRIES,
  SALARY_PERIODS,
  SALARY_PERIOD_LABEL,
  type PostJobFormValues,
} from './job-form-schema';

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
  closed = false,
  onClosedChange,
  status,
  defaults,
}: {
  register: UseFormRegister<PostJobFormValues>;
  errors: FieldErrors<PostJobFormValues>;
  /** Current value of the `publish` field — drives the statusbar. */
  publish: boolean;
  onPublishChange: (publish: boolean) => void;
  /** Whether the job is marked CLOSED (edit form only). */
  closed?: boolean;
  onClosedChange?: (closed: boolean) => void;
  /** Persisted status, on the edit form. Absent when creating. */
  status?: JobPostStatus;
  /** Initial values rendered into the server HTML so fields are not blank before hydration. */
  defaults?: Partial<PostJobFormValues>;
}) {
  return (
    <>
      <SheetTitle
        title={
          <SheetField label="Title" error={errors.title?.message} required wide>
            <Input
              defaultValue={defaults?.title ?? ''}
              {...register('title')}
              placeholder="Senior Backend Engineer"
              className="text-base font-semibold"
            />
          </SheetField>
        }
        aside={
          <JobStatusbar
            publish={publish}
            onPublishChange={onPublishChange}
            closed={closed}
            onClosedChange={onClosedChange}
            status={status}
          />
        }
      />

      <SheetGroups>
        <SheetGroup title="Classification">
          <SheetField label="Industry" error={errors.industry?.message}>
            <Select defaultValue={defaults?.industry ?? 'TECHNOLOGY'} {...register('industry')}>
              {INDUSTRIES.map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0) + v.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </SheetField>
          <SheetField label="Job type" error={errors.jobType?.message}>
            <Select defaultValue={defaults?.jobType ?? 'FULL_TIME'} {...register('jobType')}>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="TEMPORARY">Temporary</option>
            </Select>
          </SheetField>
          <SheetField label="Experience level">
            <Select
              defaultValue={defaults?.experienceLevel ?? 'MID'}
              {...register('experienceLevel')}
            >
              <option value="ENTRY">Entry</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
              <option value="STAFF">Staff</option>
              <option value="EXECUTIVE">Executive</option>
            </Select>
          </SheetField>
          <SheetField label="Work mode">
            <Select defaultValue={defaults?.workMode ?? 'ONSITE'} {...register('workMode')}>
              <option value="ONSITE">On-site</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </Select>
          </SheetField>
        </SheetGroup>

        <SheetGroup title="Location & compensation">
          <SheetField label="Location">
            <Input
              defaultValue={defaults?.location ?? ''}
              {...register('location')}
              autoComplete="address-level2"
              placeholder="Berlin, DE"
            />
          </SheetField>
          <SheetField
            label="Country"
            hint="2-letter code (e.g. UG, KE, DE). Needed for Google Jobs."
            error={errors.locationCountry?.message}
          >
            <Input
              defaultValue={defaults?.locationCountry ?? ''}
              {...register('locationCountry')}
              autoComplete="country"
              maxLength={2}
              placeholder="UG"
              className="uppercase"
            />
          </SheetField>
          <SheetField
            label="Salary range"
            hint="Leave blank to omit from the posting. State what the amount is per."
            error={errors.salaryMax?.message}
          >
            {/* Two rows. Four across left Min and Max ~47px each in the form's
                right-hand column — a six-figure salary did not fit in the box. */}
            <span className="grid grid-cols-2 gap-1.5">
              <Input
                type="number"
                inputMode="numeric"
                defaultValue={defaults?.salaryMin ?? ''}
                {...register('salaryMin')}
                aria-label="Salary minimum"
                placeholder="Min"
              />
              <Input
                type="number"
                inputMode="numeric"
                defaultValue={defaults?.salaryMax ?? ''}
                {...register('salaryMax')}
                aria-label="Salary maximum"
                placeholder="Max"
              />
              <span className="col-span-2 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-1.5">
                <Input
                  defaultValue={defaults?.salaryCurrency ?? 'USD'}
                  {...register('salaryCurrency')}
                  maxLength={3}
                  autoCapitalize="characters"
                  aria-label="Salary currency"
                  className="uppercase"
                />
                <Select
                  defaultValue={defaults?.salaryPeriod ?? 'YEAR'}
                  {...register('salaryPeriod')}
                  aria-label="Salary period"
                >
                  {SALARY_PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {SALARY_PERIOD_LABEL[p]}
                    </option>
                  ))}
                </Select>
              </span>
            </span>
          </SheetField>
          <SheetField label="Deadline">
            <Input
              type="date"
              defaultValue={defaults?.applicationDeadline ?? ''}
              {...register('applicationDeadline')}
            />
          </SheetField>
        </SheetGroup>
      </SheetGroups>

      <Notebook
        tabs={[
          {
            id: 'description',
            label: 'Description',
            hasError: Boolean(errors.description),
            content: (
              <SheetField label="Description" error={errors.description?.message} required wide>
                <Textarea
                  defaultValue={defaults?.description ?? ''}
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
            hasError: Boolean(errors.requirements),
            content: (
              <SheetField label="Requirements" error={errors.requirements?.message} required wide>
                <Textarea
                  defaultValue={defaults?.requirements ?? ''}
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
                  defaultChecked={Boolean(defaults?.createChatArea)}
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
  closed = false,
  onClosedChange,
  status,
}: {
  publish: boolean;
  onPublishChange: (publish: boolean) => void;
  closed?: boolean;
  onClosedChange?: (closed: boolean) => void;
  status?: JobPostStatus;
}) {
  const controllable: Stage[] = [
    { key: 'DRAFT', label: JOB_STATUS_LABEL.DRAFT, tone: 'neutral' },
    { key: 'PUBLISHED', label: JOB_STATUS_LABEL.PUBLISHED, tone: 'success' },
    ...(onClosedChange
      ? [{ key: 'CLOSED', label: JOB_STATUS_LABEL.CLOSED, tone: 'neutral' as const }]
      : []),
  ];
  const isOther =
    status !== undefined &&
    status !== 'DRAFT' &&
    status !== 'PUBLISHED' &&
    (status !== 'CLOSED' || !onClosedChange);
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
      // state as current; saving will move it to Draft, Published, or Closed.
      current={isOther ? status : closed ? 'CLOSED' : publish ? 'PUBLISHED' : 'DRAFT'}
      onSelect={(key) => {
        if (key === 'DRAFT') {
          onClosedChange?.(false);
          onPublishChange(false);
        }
        if (key === 'PUBLISHED') {
          onClosedChange?.(false);
          onPublishChange(true);
        }
        if (key === 'CLOSED') {
          onPublishChange(false);
          onClosedChange?.(true);
        }
      }}
    />
  );
}
