// Parse a freshly uploaded resume. Plain inline function — no durable-
// execution runtime, no automatic retries. Callers invoke it off the response
// path via Next's `after()` (apply action, upload route) and log failures. A
// transient AI/blob failure leaves parsedJson/embedding NULL; the
// algolia-reconcile cron's AI sweep re-runs stranded resumes (oldest first,
// Resume.parseAttempts capped) so those recover on the next sweep.
//
// Steps:
//   1. Fetch the Resume row.
//   2. Read the file bytes THROUGH THE STORE (lib/storage/blob.ts) — never by
//      fetching a URL taken from the row.
//   3. file-type magic-byte check vs the allowed set; reject mismatch.
//   4. Extract text (lib/resume/extract-text.ts — budgeted PDF/DOCX readers).
//   5. Parse with the model, the resume fenced as untrusted data. If the model
//      is unreachable, fall back to the heuristic parser and mark the result
//      `_source: 'heuristic'` so the sweep upgrades it later.
//   6. Persist parsedJson; link catalog skills.
//   7. Embed (width + model validated) and write the pgvector column.
//
// Idempotent: fully-processed resumes (model-parsed + embedding present) are
// skipped; a resume whose parse landed but whose embedding write failed gets
// just the embedding recomputed from the stored parse; a heuristic-parsed
// resume is re-parsed with the model.

import { generateObject } from 'ai';
import { fileTypeFromBuffer } from 'file-type';
import { MODELS } from '@/lib/ai/gateway';
import { aiModelFor, logAiCall } from '@/lib/ai/groq';
import { embedText, toVectorLiteral } from '@/lib/ai/embeddings';
import {
  ResumeSchema,
  RESUME_PARSE_SYSTEM,
  type ParsedResume,
} from '@/lib/ai/prompts/resume-parse';
import { fenceUntrusted, sanitizeUntrustedText, untrustedInputNotice } from '@/lib/ai/untrusted';
import { db } from '@/lib/db';
import { RESUME_MIME, readBlobBytes } from '@/lib/storage/blob';
import {
  EXTRACT_LIMITS,
  extractResumeText,
  ResumeExtractionError,
} from '@/lib/resume/extract-text';
import { heuristicParseResume } from '@/lib/resume/heuristic-parser';
import { logger } from '@/lib/observability/logger';
import type { Prisma } from '@prisma/client';

export { heuristicParseResume };

export type ResumeParseInput = { resumeId: string };

/** Where a stored parse came from. Persisted inside parsedJson as `_source`. */
export type ParseSource = 'model' | 'heuristic';
type StoredParse = ParsedResume & { _source?: ParseSource };

const MIN_TEXT_CHARS = 30;
// Fixed cap on what is embedded; embedText() applies its own ceiling as well.
const EMBED_CHARS = 8_000;

/**
 * What gets embedded for matching. Built from several structured fields rather
 * than only the model-written summary: a single free-text field is exactly what
 * a keyword-stuffing candidate would target, and a short summary also embeds
 * poorly against a long job description.
 */
export function embeddingTextFrom(parsed: ParsedResume): string {
  const parts: string[] = [];
  // Arrays are defaulted: a résumé generated from the profile (generateResume)
  // stores a ParsedResume-shaped object that need not carry every field.
  const skills = parsed.skills ?? [];
  const experience = parsed.experience ?? [];
  if (parsed.headline) parts.push(parsed.headline);
  if (parsed.summary) parts.push(parsed.summary);
  if (skills.length > 0) parts.push(`Skills: ${skills.join(', ')}`);
  for (const job of experience.slice(0, 8)) {
    const line = [job.title, job.company].filter(Boolean).join(' at ');
    parts.push(job.description ? `${line}: ${job.description}` : line);
  }
  return parts.join('\n').slice(0, EMBED_CHARS);
}

export async function runResumeParse({ resumeId }: ResumeParseInput): Promise<void> {
  const resume = await db.resume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new Error(`Resume ${resumeId} not found`);

  const stored = resume.parsedJson as StoredParse | null;
  const needsModelUpgrade = stored?._source === 'heuristic';

  if (stored && !needsModelUpgrade) {
    // Parsed already — but the embedding write is a separate step and can have
    // failed after the parse landed. Repair just the embedding from the stored
    // parse (no re-download, no second model call); skip when both exist.
    // "Has an embedding" means one from the CURRENT model — a vector from a
    // retired model is not comparable and is rebuilt from the stored parse.
    const row = await db.$queryRaw<Array<{ hasEmbedding: boolean }>>`
      SELECT (embedding IS NOT NULL AND "embeddingModel" = ${MODELS.embedding}) AS "hasEmbedding"
        FROM resumes WHERE id = ${resumeId}::uuid
    `;
    if (row[0]?.hasEmbedding) {
      logger.info({ resumeId }, 'resume already parsed; skipping');
      return;
    }
    await writeEmbedding(
      resumeId,
      embeddingTextFrom(stored) || JSON.stringify(stored).slice(0, EMBED_CHARS),
    );
    logger.info({ resumeId }, 'resume embedding repaired from stored parse');
    return;
  }

  // 1. Read the bytes from our own store (the locator is never fetched as a URL).
  const bytes = await readBlobBytes(resume.fileBlobUrl, {
    maxBytes: EXTRACT_LIMITS.maxInputBytes,
  });

  // 2. Magic-byte mime check
  const detected = await fileTypeFromBuffer(bytes);
  if (!detected || !RESUME_MIME.includes(detected.mime as (typeof RESUME_MIME)[number])) {
    logger.warn(
      { resumeId, declared: resume.fileMime, detected: detected?.mime },
      'mime mismatch — rejecting',
    );
    await db.resume.update({ where: { id: resumeId }, data: { deletedAt: new Date() } });
    throw new Error('Mime mismatch');
  }

  // 3. Extract text. A hostile or corrupt file is a *permanent* failure: record
  //    it now so the UI stops saying "Processing…", rather than letting the
  //    sweep burn five attempts finding out.
  let text: string;
  try {
    text = sanitizeUntrustedText(await extractResumeText(bytes, detected.mime));
  } catch (err) {
    if (err instanceof ResumeExtractionError) {
      await db.resume.update({
        where: { id: resumeId },
        data: { parseFailedAt: new Date(), parseError: err.message.slice(0, 500) },
      });
      logger.warn({ resumeId, code: err.code }, 'resume text extraction rejected the file');
    }
    throw err;
  }
  if (text.length < MIN_TEXT_CHARS) throw new Error('Resume text too short to parse');

  // 4. Structured parse. The resume is fenced as data and the system prompt
  //    says so; the result is schema-constrained either way.
  let parsed: ParsedResume;
  let source: ParseSource = 'model';
  try {
    const { model, providerOptions } = aiModelFor('resume-parse');
    const startedAt = Date.now();
    const { object, response, usage, finishReason } = await generateObject({
      model,
      schema: ResumeSchema,
      system: `${RESUME_PARSE_SYSTEM}\n\n${untrustedInputNotice('resume')}`,
      prompt: fenceUntrusted('resume', text),
      temperature: 0,
      providerOptions,
    });
    logAiCall('resume-parse', { response, usage, finishReason, startedAt });
    parsed = object;
  } catch (aiErr) {
    logger.warn(
      { err: aiErr, resumeId, task: 'resume-parse' },
      'model parse failed — using the heuristic parser (will be re-parsed when the model is reachable)',
    );
    const allSkills = await db.skill.findMany({ select: { slug: true } });
    parsed = heuristicParseResume(
      text,
      allSkills.map((s) => s.slug),
    );
    source = 'heuristic';
  }

  // 5. Persist parsedJson first: if the embedding step fails, the stored parse
  //    lets the reconcile sweep repair the embedding without a second model call.
  const toStore: StoredParse = { ...parsed, _source: source };
  await db.resume.update({
    where: { id: resumeId },
    data: { parsedJson: toStore as unknown as Prisma.InputJsonValue },
  });

  // 6. Link skills from the parsed list against our canonical Skill catalog.
  await linkCatalogSkills(resume.userId, parsed.skills);

  // 7. Embedding for match scoring. Errors propagate: a swallowed failure here
  //    is what hid the 3072-vs-1536 width mismatch behind a "model unavailable"
  //    log line. The parse is already saved, so a throw costs nothing but is
  //    visible to the caller (Sentry) and to the sweep.
  await writeEmbedding(resumeId, embeddingTextFrom(parsed) || text.slice(0, EMBED_CHARS));

  logger.info({ resumeId, skills: parsed.skills.length, source }, 'resume parsed');
}

async function linkCatalogSkills(userId: string, skills: string[]): Promise<void> {
  if (skills.length === 0) return;
  const slugs = skills.map((s) =>
    s
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
  );
  const matched = await db.skill.findMany({ where: { slug: { in: slugs } } });
  if (matched.length === 0) return;
  const profile = await db.jobSeekerProfile.findUnique({ where: { userId } });
  if (!profile) return;
  await db.jobSeekerSkill.createMany({
    data: matched.map((skill) => ({
      jobSeekerProfileId: profile.id,
      skillId: skill.id,
      proficiency: 3,
      years: 0,
    })),
    // Never overwrite a proficiency the user has already set by hand.
    skipDuplicates: true,
  });
}

// Embed the given text and write it to the pgvector column. Raw SQL —
// `'[0.1,0.2,...]'::vector` literal — because Prisma's Unsupported() type
// can't be set directly. embedText() has already validated the width.
async function writeEmbedding(resumeId: string, value: string): Promise<void> {
  const { embedding, model } = await embedText(value);
  await db.$executeRaw`
    UPDATE resumes
       SET embedding = ${toVectorLiteral(embedding)}::vector,
           "embeddingModel" = ${model}
     WHERE id = ${resumeId}::uuid
  `;
}
