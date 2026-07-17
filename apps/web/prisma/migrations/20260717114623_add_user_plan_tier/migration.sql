-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "plan" "PlanTier" NOT NULL DEFAULT 'PRO';

-- The 5 DROP INDEX statements Prisma auto-generated here (job_posts_embedding_hnsw,
-- job_posts_geo_gist, job_posts_title_trgm, job_posts_tsv_gin, resumes_embedding_hnsw)
-- were removed by hand. Prisma's schema diff sees these as drift because they're
-- created via raw SQL in 20260609000000_init (Unsupported() columns — vector/geography/
-- tsvector — aren't representable as Prisma-managed indexes; see the schema.prisma
-- header comment). Applying the auto-generated version against a real dev DB actually
-- dropped all 5 indexes; they were recreated by hand and this file fixed before any
-- deploy could repeat that against production. If a future `prisma migrate dev` run
-- regenerates these DROP statements again, remove them the same way before applying.
