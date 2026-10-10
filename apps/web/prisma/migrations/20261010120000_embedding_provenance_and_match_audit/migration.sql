-- Embedding provenance + match-score audit columns.
--
-- Hand-authored (no dev DB in this environment), matching the repo pattern:
-- table names are the schema's @@map snake_case; column names follow the
-- schema's convention of unmapped camelCase fields. Expand-only and nullable,
-- so the previous application build keeps working while this applies.
--
-- Why: vectors from different embedding models (or widths) are not comparable,
-- and a recruiter-visible match score is an AI-assisted evaluation of a person.
-- Recording which model produced each vector / score — and when — is what lets
-- a model change find and redo the old output, and lets an operator answer
-- "how was this score produced?" (EU AI Act / GDPR Art. 22 / US state ADS rules).
--
-- Existing rows keep NULL, which the AI sweep treats as "produced by an unknown
-- model" and re-embeds. (Any embedding already present was written by the
-- previous 3072-wide model path and could not have been stored in these
-- vector(1536) columns anyway.)

ALTER TABLE "resumes"          ADD COLUMN IF NOT EXISTS "embeddingModel" TEXT;
ALTER TABLE "job_posts"        ADD COLUMN IF NOT EXISTS "embeddingModel" TEXT;
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "matchModel"     TEXT;
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "matchScoredAt"  TIMESTAMP(3);
