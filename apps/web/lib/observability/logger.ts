import pino from 'pino';

// Structured logger. PII redaction is non-negotiable — adding a field to a
// hot path that contains a password or token is the kind of mistake an audit
// catches once, and a leaked credential pays for forever.

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.body.password',
      'req.body.confirmPassword',
      'req.body.token',
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.confirmPassword',
      '*.token',
      '*.refreshToken',
      '*.authorization',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export function withRequestContext(reqId: string) {
  return logger.child({ reqId });
}
