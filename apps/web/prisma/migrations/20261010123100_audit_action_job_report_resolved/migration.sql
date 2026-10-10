-- AuditAction += JOB_REPORT_RESOLVED (see the previous migration for why this
-- is a separate file).
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'JOB_REPORT_RESOLVED';
