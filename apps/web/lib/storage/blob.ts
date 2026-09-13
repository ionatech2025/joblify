import { put, del, list } from '@vercel/blob';

export const RESUME_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;

// JOB_UC_08.1 Test 92: 5MB resume limit
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function resumePathPrefix(userId: string): string {
  return `resumes/${userId}/`;
}

export function logoPathPrefix(companyId: string): string {
  return `logos/${companyId}/`;
}

// Re-exports so call sites don't have to know we use @vercel/blob.
export { put, del, list };
