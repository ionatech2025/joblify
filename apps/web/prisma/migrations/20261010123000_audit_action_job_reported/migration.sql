-- AuditAction += JOB_REPORTED.
--
-- One enum value per migration, on purpose: PostgreSQL <= 11 cannot add more
-- than one value to an enum in a single migration, and a newly added value
-- cannot be used inside the transaction that added it. Neither is a concern on
-- Neon's current Postgres, but the pattern costs nothing and cannot regress.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'JOB_REPORTED';
