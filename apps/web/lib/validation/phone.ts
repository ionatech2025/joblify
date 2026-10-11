import { z } from 'zod';

// One rule for every phone field. It used to be /^\d{10}$/ in four places —
// ten digits, nothing else — which a person in Kampala could satisfy with a
// local number and nobody could satisfy with their international one
// ("+256 743 535 678" has a "+", spaces and twelve digits). Browsers autofill
// the international form, so the rule rejected the value the browser offered.
//
// What is accepted: an optional leading "+", then 7-15 digits (E.164's ceiling
// is 15), with spaces, dashes, dots and parentheses allowed between them as
// people type numbers. What is stored is the normalised form — "+" and digits —
// so a `tel:` link and anything that compares numbers see one shape.

export const PHONE_MESSAGE =
  'Enter a phone number with 7 to 15 digits. A leading + and spaces or dashes are fine.';

/** "+256 (743) 535-678" -> "+256743535678". Does not validate. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  return (trimmed.startsWith('+') ? '+' : '') + trimmed.replace(/\D/g, '');
}

export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();
  // Only phone punctuation: stops "call me on 0743..." from being "normalised"
  // into a number by throwing the words away.
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return false;
  return /^\+?\d{7,15}$/.test(normalizePhone(trimmed));
}

/** Optional phone field: '' or undefined is fine; anything else must be a phone number. */
export const optionalPhone = z
  .string()
  .trim()
  .max(40)
  .refine((v) => v === '' || isValidPhone(v), PHONE_MESSAGE)
  .transform((v) => (v === '' ? '' : normalizePhone(v)))
  .optional();
