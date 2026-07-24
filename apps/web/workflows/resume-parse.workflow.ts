// Parse a freshly uploaded resume. Plain inline function — no durable-
// execution runtime, no automatic retries. Callers invoke it off the response
// path via Next's `after()` (apply action, upload route) and log failures. A
// transient AI/blob failure leaves parsedJson/embedding NULL; the
// algolia-reconcile cron's AI sweep re-runs stranded resumes (oldest first,
// Resume.parseAttempts capped) so those recover on the next sweep.
//
// Steps:
//   1. Fetch the Resume row + signed Blob URL.
//   2. Download the file bytes.
//   3. file-type magic-byte check vs claimed mime; reject mismatch.
//   4. Extract text via pdf-parse (PDF) or mammoth (DOCX).
//   5. Call Haiku via AI Gateway with the ResumeSchema.
//   6. Persist parsedJson to the Resume row.
//   7. Embed parsed text via openai/text-embedding-3-large; write `embedding`
//      column with raw SQL (Prisma's Unsupported() type can't be set
//      directly).
//   8. Match the parsed skills against the Skill catalog and link via
//      JobSeekerSkill.
//
// Idempotent: fully-processed resumes (parsedJson + embedding present) are
// skipped; a resume whose parse landed but whose embedding write failed gets
// just the embedding recomputed from the stored parse.

import { generateObject, embed } from 'ai';
import { fileTypeFromBuffer } from 'file-type';
import { gateway, MODELS } from '@/lib/ai/gateway';
import { ResumeSchema, RESUME_PARSE_SYSTEM } from '@/lib/ai/prompts/resume-parse';
import { db } from '@/lib/db';
import { RESUME_MIME } from '@/lib/storage/blob';
import { logger } from '@/lib/observability/logger';
import type { Prisma } from '@prisma/client';

export type ResumeParseInput = { resumeId: string };

export async function runResumeParse({ resumeId }: ResumeParseInput): Promise<void> {
  const resume = await db.resume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new Error(`Resume ${resumeId} not found`);
  if (resume.parsedJson) {
    // Parsed already — but the embedding write is a separate step and can have
    // failed after the parse landed. Repair just the embedding from the stored
    // parse (no re-download, no second Haiku call); skip when both exist.
    const row = await db.$queryRaw<Array<{ hasEmbedding: boolean }>>`
      SELECT embedding IS NOT NULL AS "hasEmbedding" FROM resumes WHERE id = ${resumeId}::uuid
    `;
    if (row[0]?.hasEmbedding) {
      logger.info({ resumeId }, 'resume already parsed; skipping');
      return;
    }
    const stored = resume.parsedJson as { summary?: string | null };
    await writeEmbedding(resumeId, stored.summary ?? JSON.stringify(resume.parsedJson).slice(0, 8000));
    logger.info({ resumeId }, 'resume embedding repaired from stored parse');
    return;
  }

  // 1. Download
  const fileRes = await fetch(resume.fileBlobUrl);
  if (!fileRes.ok) throw new Error(`Failed to fetch blob: ${fileRes.status}`);
  const bytes = new Uint8Array(await fileRes.arrayBuffer());

  // 2. Magic-byte mime check
  const detected = await fileTypeFromBuffer(bytes);
  if (!detected || !RESUME_MIME.includes(detected.mime as (typeof RESUME_MIME)[number])) {
    logger.warn({ resumeId, declared: resume.fileMime, detected: detected?.mime }, 'mime mismatch — rejecting');
    await db.resume.update({ where: { id: resumeId }, data: { deletedAt: new Date() } });
    throw new Error('Mime mismatch');
  }

  // 3. Extract text
  const text = await extractText(bytes, detected.mime);
  if (text.length < 30) throw new Error('Resume text too short to parse');

  // 4. Structured parse via Haiku
  const { object: parsed } = await generateObject({
    model: gateway(MODELS.haiku),
    schema: ResumeSchema,
    system: RESUME_PARSE_SYSTEM,
    prompt: text.slice(0, 80_000),
    temperature: 0,
  });

  // 5. Persist parsedJson first: if the embedding step fails, the stored parse
  //    lets the reconcile sweep repair the embedding without a second Haiku call.
  await db.resume.update({
    where: { id: resumeId },
    data: { parsedJson: parsed as unknown as Prisma.InputJsonValue },
  });

  // 6. Embedding for match score
  await writeEmbedding(resumeId, parsed.summary ?? text.slice(0, 8000));

  // 7. Link skills from the parsed list against our canonical Skill catalog.
  if (parsed.skills.length > 0) {
    const slugs = parsed.skills.map((s) =>
      s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    );
    const matched = await db.skill.findMany({ where: { slug: { in: slugs } } });
    const profile = await db.jobSeekerProfile.findUnique({ where: { userId: resume.userId } });
    if (profile) {
      for (const skill of matched) {
        await db.jobSeekerSkill.upsert({
          where: { jobSeekerProfileId_skillId: { jobSeekerProfileId: profile.id, skillId: skill.id } },
          create: { jobSeekerProfileId: profile.id, skillId: skill.id, proficiency: 3, years: 0 },
          update: {},
        });
      }
    }
  }

  logger.info({ resumeId, skills: parsed.skills.length }, 'resume parsed');
}

// Embed the given text and write it to the pgvector column. Raw SQL —
// `'[0.1,0.2,...]'::vector` literal — because Prisma's Unsupported() type
// can't be set directly.
async function writeEmbedding(resumeId: string, value: string): Promise<void> {
  const { embedding } = await embed({
    model: gateway.textEmbeddingModel(MODELS.embeddingLarge),
    value,
  });
  const vectorLiteral = `[${embedding.join(',')}]`;
  await db.$executeRaw`
    UPDATE resumes
       SET embedding = ${vectorLiteral}::vector
     WHERE id = ${resumeId}::uuid
  `;
}

async function extractText(bytes: Uint8Array, mime: string): Promise<string> {
  if (mime === 'application/pdf') {
    const { default: pdfParse } = await import('pdf-parse');
    const result = await pdfParse(Buffer.from(bytes));
    return result.text;
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  ) {
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value;
  }
  throw new Error(`Unsupported mime ${mime}`);
}
