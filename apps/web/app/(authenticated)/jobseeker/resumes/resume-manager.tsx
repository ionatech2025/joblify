'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { registerResume, deleteResume } from '@/app/actions/uploads';

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
    <div style={{ marginTop: '1.5rem' }}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          padding: '0.7rem 1.2rem',
          background: '#111',
          color: '#fff',
          border: 0,
          borderRadius: 8,
          fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? 'Uploading…' : 'Upload a resume'}
      </button>

      {error && <p style={{ color: '#a00', marginTop: '0.75rem' }}>{error}</p>}

      {resumes.length === 0 ? (
        <p style={{ color: '#888', marginTop: '1.5rem' }}>No resumes yet — upload one to start applying.</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            marginTop: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {resumes.map((r) => (
            <li
              key={r.id}
              style={{
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                padding: '0.9rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <a
                  href={r.fileBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 600, color: '#111', textDecoration: 'none' }}
                >
                  {r.title}
                </a>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
                  {r.parsed ? 'Parsed ✓' : 'Processing…'} · added{' '}
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(r.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: '0.4rem 0.7rem',
                  cursor: 'pointer',
                  color: '#a00',
                }}
                aria-label={`Delete ${r.title}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
