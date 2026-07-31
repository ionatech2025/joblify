-- Resume parse permanent-failure tracking (Phase 4 audit follow-up).
--
-- Hand-authored (no dev DB in this environment), matching the repo pattern —
-- see 20260724120000_digest_watermark_and_parse_attempts.
--
-- Set once algolia-reconcile's AI sweep hits MAX_PARSE_ATTEMPTS with
-- parsedJson still null. The cron's own retry filter (parseAttempts <
-- MAX_PARSE_ATTEMPTS) already excludes a row from all future attempts once
-- that happens, so there's no spontaneous-recovery path — this makes that
-- terminal state visible to the UI instead of showing "Processing…" forever.
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "parseFailedAt" TIMESTAMP(3);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "parseError" TEXT;
