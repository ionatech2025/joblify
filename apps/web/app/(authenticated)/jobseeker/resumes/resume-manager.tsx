'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { registerResume, deleteResume } from '@/app/actions/uploads';
import { Button } from '@/app/components/ui/button';

type ResumeRow = { id: string; title: string; fileBlobUrl: string; parsed: boolean; createdAt: string };

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
      setResumes((prev) => [{ ...created, parsed: false }, ...prev]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Use a PDF or Word file under 10MB.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    const prev = resumes;
    setResumes((r) => r.filter((x) => x.id !== id));
    try {
      await deleteResume(id);
      router.refresh();
    } catch {
      setResumes(prev);
      setError('Could not delete that resume. Try again.');
    }
  }

  return (
    <div className="mt-6">
      <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} className="hidden" aria-hidden="true" />
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? 'Uploading…' : 'Upload a resume'}
      </Button>

      {error && <p className="mt-3 text-red-700">{error}</p>}

      {resumes.length === 0 ? (
        <p className="mt-6 text-neutral-500">No resumes yet — upload one to start applying.</p>
      ) : (
        <ul className="mt-6 flex list-none flex-col gap-3 p-0">
          {resumes.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-soft"
            >
              <div className="min-w-0">
                <a
                  href={r.fileBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-neutral-900 no-underline hover:underline"
                >
                  {r.title}
                </a>
                <p className="mt-1 mb-0 text-sm text-neutral-500">
                  {r.parsed ? 'Parsed ✓' : 'Processing…'} · added {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => onDelete(r.id)}
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
