import pino from 'pino';

// Structured logger. PII redaction is non-negotiable — adding a field to a
// hot path that contains a password or token is the kind of mistake an audit
// catches once, and a leaked credential pays for forever.

/**
 * Paths whose values never reach a log line. Two groups:
 *
 *   credentials — passwords, tokens, authorization headers, cookies;
 *   personal data — contact details, free text a person wrote about themselves
 *   or that an employer wrote about them, and the storage locators of private
 *   documents. This app handles résumés and hiring notes, and the redact list
 *   used to cover only the credentials, so `logger.warn({ user }, …)` would
 *   have written an email address and phone number into the log pipeline.
 *
 * `*.x` matches `x` one level down (pino's wildcard does not recurse), so both
 * the bare key and the one-level form are listed.
 */
const SENSITIVE_KEYS = [
  // credentials
  'password',
  'confirmPassword',
  'token',
  'refreshToken',
  'authorization',
  'cookie',
  // personal data
  'email',
  'phone',
  'coverLetter',
  'recruiterNotes',
  'bio',
  'fileBlobUrl',
  'attachmentUrl',
  'parsedJson',
] as const;

export const REDACT_PATHS: string[] = [
  'req.body.password',
  'req.body.confirmPassword',
  'req.body.token',
  'req.headers.authorization',
  'req.headers.cookie',
  ...SENSITIVE_KEYS,
  ...SENSITIVE_KEYS.map((k) => `*.${k}`),
];

export function createLogger(destination?: pino.DestinationStream) {
  return pino(
    {
      level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
      formatters: {
        level: (label) => ({ level: label }),
      },
    },
    destination,
  );
}

export const logger = createLogger();

export function withRequestContext(reqId: string) {
  return logger.child({ reqId });
}
