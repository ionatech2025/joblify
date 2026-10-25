'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import Link from 'next/link';
import { CheckCircle2, FileText, TriangleAlert, Upload } from 'lucide-react';
import { registerResume, deleteResume, uploadResumeDirect } from '@/app/actions/uploads';
import { unwrap } from '@/lib/action-result';
import { Badge } from '@/app/components/ui/badge';
import { Button, buttonClasses } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { toast } from '@/lib/stores/ui';
import { TimeStamp } from '@/app/components/ui/timestamp';

type ResumeRow = {
  id: string;
  title: string;
  parsed: boolean;
  parseFailed: boolean;
  createdAt: string;
};

// PDF and .docx only: legacy .doc (OLE2) has no maintained reader, so accepting
// it would just produce a file that can never be parsed.
const ACCEPT =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function ResumeManager({
  userId,
  initialResumes,
}: {
  userId: string;
  initialResumes: ResumeRow[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<ResumeRow[]>(initialResumes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      let created: ResumeRow;

      // Try Vercel Blob client upload first if configured
      try {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        // Résumés go to the PRIVATE store: the returned URL is not readable on
        // its own, and registerResume() re-derives everything it persists from
        // the store rather than from what we send.
        const blob = await upload(`resumes/${userId}/${safe}`, file, {
          access: 'private',
          handleUploadUrl: '/api/v1/uploads/sign',
        });
        const reg = await registerResume({ url: blob.url, title: file.name });
        created = { ...reg, parsed: false, parseFailed: false };
      } catch {
        // Fall back to direct server-side upload when client token / Vercel Blob is not available
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadResumeDirect(formData);
        const reg = unwrap(res);
        created = { ...reg, parsed: false, parseFailed: false };
      }

      setResumes((prev) => [created, ...prev]);
      router.refresh();
      // Parsing is asynchronous, so say so — otherwise the row appears
      // unparsed and reads as a half-failed upload.
      toast.success('Resume uploaded', 'We’re parsing it now; match scores appear shortly.');
    } catch (err) {
      let message =
        err instanceof Error
          ? err.message
          : 'Upload failed. Use a PDF or Word (.docx) file under 5MB.';
      if (message.includes('Vercel Blob') || message.includes('token')) {
        message =
          'Upload failed. Please ensure the file is a PDF or Word (.docx) document under 5MB.';
      }
      setError(message);
      toast.error('Upload failed', message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string, title: string) {
    // Unlike un-saving a job or a search, this is not reversible — the blob and
    // its parsed data go away — so it gets a confirm like the other
    // irreversible actions (job delete, company rejection).
    if (
      !window.confirm(
        `Delete “${title}”? This can't be undone, and any match scores computed from it are removed.`,
      )
    ) {
      return;
    }
    setError(null);
    const prev = resumes;
    setResumes((r) => r.filter((x) => x.id !== id));
    try {
      await deleteResume(id);
      router.refresh();
      toast.success('Resume deleted');
    } catch {
      setResumes(prev);
      setError('Could not delete that resume. Try again.');
      toast.error("Couldn't delete that resume", 'Try again in a moment.');
    }
  }

  const columns: ListColumn<ResumeRow>[] = [
    {
      key: 'title',
      header: 'Document',
      cell: (r) => (
        <div className="min-w-0">
          {/* Authenticated download route — résumés are not publicly addressable. */}
          <a
            href={`/api/v1/resumes/${r.id}/file`}
            rel="noopener noreferrer"
            className="text-fg font-semibold no-underline hover:underline"
          >
            {r.title}
          </a>
          {r.parseFailed && (
            <p className="text-fg-muted mt-1 mb-0 max-w-xl text-[12px]">
              We couldn’t extract text from this file after several tries — it may be a scanned
              image, corrupted, or password-protected. Match scores and autofill won’t work with it;
              delete it and upload a different file.
            </p>
          )}
        </div>
      ),
      aggregate: () => `${resumes.length} ${resumes.length === 1 ? 'resume' : 'resumes'}`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) =>
        r.parsed ? (
          <Badge tone="success" className="gap-1">
            <CheckCircle2 aria-hidden className="size-3" />
            Parsed
          </Badge>
        ) : r.parseFailed ? (
          <Badge tone="danger" className="gap-1">
            <TriangleAlert aria-hidden className="size-3" />
            Couldn’t parse
          </Badge>
        ) : (
          <Badge tone="neutral">Processing…</Badge>
        ),
    },
    {
      key: 'added',
      header: 'Added',
      align: 'end',
      hideBelow: 'sm',
      cell: (r) => <TimeStamp value={r.createdAt} className="text-fg-muted" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (r) => (
        <Button
          variant="danger"
          size="sm"
          type="button"
          onClick={() => onDelete(r.id, r.title)}
          aria-label={`Delete ${r.title}`}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="o-sheet mb-3 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-fg m-0 text-[13px] font-medium">
            Upload a PDF or Word (.docx) résumé (up to 5 MB)
          </p>
          <p className="text-fg-muted m-0 mt-0.5 text-[12px]">
            We parse it to autofill applications and score your matches. Don&apos;t have a file
            handy?{' '}
            <Link href="/jobseeker/resumes/builder" className="text-brand underline">
              Build one from your profile
            </Link>
            .
          </p>
        </div>
        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={onPick}
            className="hidden"
            aria-hidden="true"
          />
          <Button
            type="button"
            size="sm"
            icon={<Upload aria-hidden className="size-3.5" />}
            onClick={() => inputRef.current?.click()}
            loading={busy}
          >
            {busy ? 'Uploading…' : 'Upload a resume'}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-danger mb-3 text-[13px]">
          {error}
        </p>
      )}

      {resumes.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No resumes yet"
          description="Upload a PDF or Word (.docx) document, or build one here. We parse it to prefill applications and score your match against every role."
          action={
            <Link
              href="/jobseeker/resumes/builder"
              className={`${buttonClasses('secondary')} no-underline`}
            >
              Build a resume
            </Link>
          }
        />
      ) : (
        <ListView
          caption="Uploaded resumes"
          rows={resumes}
          rowKey={(r) => r.id}
          columns={columns}
        />
      )}
    </div>
  );
}
