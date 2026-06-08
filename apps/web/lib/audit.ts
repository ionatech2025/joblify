import { db } from './db';
import type { AuditAction } from '@prisma/client';

// withAudit wraps a state-changing operation: it runs the work, then writes
// an AuditEvent in the same transaction so the audit log can never drift
// from reality. Use this for every Server Action / Route Handler that mutates.

export type AuditContext = {
  actorId: string | null;
  ip: string | null;
  ua: string | null;
};

export type AuditMeta = {
  action: AuditAction;
  entity: string;
  entityId?: string;
  before?: unknown;
  // `result` is whatever the wrapped op returns. Loosely typed on purpose so
  // the generic T is inferred purely from `fn` (annotating it here re-introduces
  // a callback-inference ordering trap that collapses T to `unknown`).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  after?: (result: any) => unknown;
};

export async function withAudit<T>(
  ctx: AuditContext,
  meta: AuditMeta,
  fn: (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    const result = await fn(tx);
    await tx.auditEvent.create({
      data: {
        actorId: ctx.actorId,
        action: meta.action,
        entity: meta.entity,
        entityId: meta.entityId ?? null,
        before: (meta.before ?? null) as never,
        after: (meta.after ? meta.after(result) : null) as never,
        ip: ctx.ip,
        ua: ctx.ua,
      },
    });
    return result;
  });
}
