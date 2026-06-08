import { put, del, list } from '@vercel/blob';

export const RESUME_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const RESUME_MAX_BYTES = 10 * 1024 * 1024;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function resumePathPrefix(userId: string): string {
  return `resumes/${userId}/`;
}

export function logoPathPrefix(companyId: string): string {
  return `logos/${companyId}/`;
}

// Re-exports so call sites don't have to know we use @vercel/blob.
export { put, del, list };
