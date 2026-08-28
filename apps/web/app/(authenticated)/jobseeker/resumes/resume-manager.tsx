'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import Link from 'next/link';
import { CheckCircle2, FileText, TriangleAlert } from 'lucide-react';
import { registerResume, deleteResume } from '@/app/actions/uploads';
import { Button, buttonClasses } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { toast } from '@/lib/stores/ui';
import { TimeStamp } from '@/app/components/ui/timestamp';

type ResumeRow = {
  id: string;
  title: string;
  fileBlobUrl: string;
  parsed: boolean;
  parseFailed: boolean;
  createdAt: string;
};

const ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await upload(`resumes/${userId}/${safe}`, file, {
        access: 'public',
        handleUploadUrl: '/api/v1/uploads/sign',
        clientPayload: JSON.stringify({ kind: 'resume' }),
      });
      const created = await registerResume({
        url: blob.url,
        title: file.name,
        contentType: file.type || undefined,
        sizeBytes: file.size,
      });
      setResumes((prev) => [{ ...created, parsed: false, parseFailed: false }, ...prev]);
      router.refresh();
      // Parsing is asynchronous, so say so — otherwise the row appears
      // unparsed and reads as a half-failed upload.
      toast.success('Resume uploaded', 'We’re parsing it now; match scores appear shortly.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Use a PDF or Word file under 10MB.';
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

  return (
    <div className="mt-6">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        className="hidden"
        aria-hidden="true"
      />
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? 'Uploading…' : 'Upload a resume'}
      </Button>

      {error && <p className="mt-3 text-danger">{error}</p>}

      {resumes.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<FileText />}
          title="No resumes yet"
          description="Upload a PDF or Word document, or build one here. We parse it to prefill applications and score your match against every role."
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
        <ul className="mt-6 flex list-none flex-col gap-3 p-0">
          {resumes.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-soft"
            >
              <div className="min-w-0">
                <a
                  href={r.fileBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-fg no-underline hover:underline"
                >
                  {r.title}
                </a>
                <p className="mt-1 mb-0 text-sm text-fg-subtle">
                  {r.parsed ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 aria-hidden className="size-3.5 text-success" />
                      Parsed
                    </span>
                  ) : r.parseFailed ? (
                    <span className="inline-flex items-center gap-1 text-danger">
                      <TriangleAlert aria-hidden className="size-3.5" />
                      Couldn’t parse this file
                    </span>
                  ) : (
                    'Processing…'
                  )}{' '}
                  · added <TimeStamp value={r.createdAt} />
                </p>
                {r.parseFailed && (
                  <p className="mt-1 mb-0 text-sm text-fg-muted">
                    We couldn’t extract text from this file after several tries — it may be a
                    scanned image, corrupted, or password-protected. Match scores and autofill won’t
                    work with it; delete it and upload a different file.
                  </p>
                )}
              </div>
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => onDelete(r.id, r.title)}
                aria-label={`Delete ${r.title}`}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
