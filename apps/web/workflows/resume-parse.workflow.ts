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
import { ResumeSchema, RESUME_PARSE_SYSTEM, type ParsedResume } from '@/lib/ai/prompts/resume-parse';
import { db } from '@/lib/db';
import { RESUME_MIME } from '@/lib/storage/blob';
import { logger } from '@/lib/observability/logger';
import type { Prisma } from '@prisma/client';

export type ResumeParseInput = { resumeId: string };

/**
 * Heuristic parser used as a robust fallback when AI Gateway is unavailable,
 * rate-limited, or unconfigured. Extracts contact info, summary, and skills
 * by cross-referencing against the canonical Skill catalog.
 */
export function heuristicParseResume(text: string, knownSkillSlugs: string[] = []): ParsedResume {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/,
  );

  const email = emailMatch ? emailMatch[0] : null;
  const phone = phoneMatch ? phoneMatch[0] : null;

  // Name and headline extraction
  let fullName: string | null = null;
  let headline: string | null = null;

  const headerLines: string[] = [];
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const l = lines[i];
    if (!l) continue;
    if (/^(about|summary|work experience|experience|skills|contact)/i.test(l)) break;
    if (l.includes('@') || l.includes('+') || l.includes('http')) continue;
    headerLines.push(l);
  }

  const isJobTitle = (s: string) =>
    /engineer|developer|designer|manager|specialist|lead|consultant|architect|officer|coordinator|director|intern|partner|practitioner|founder/i.test(
      s,
    );

  if (headerLines.length >= 2) {
    const first = headerLines[0] ?? '';
    const second = headerLines[1] ?? '';
    const l0Words = first.split(/\s+/).length;
    const l1Words = second.split(/\s+/).length;

    if (
      l0Words === 1 &&
      l1Words === 1 &&
      !isJobTitle(second) &&
      first.length < 25 &&
      second.length < 25
    ) {
      fullName = `${first} ${second}`;
      if (headerLines[2]) headline = headerLines.slice(2).join(' · ');
    } else {
      fullName = first;
      if (headerLines.length > 1) {
        headline = headerLines.slice(1).join(' · ');
      }
    }
  } else if (headerLines.length > 0) {
    fullName = headerLines[0] ?? null;
  }

  // Summary / About section extraction
  let summary: string | null = null;
  const aboutMatch = text.match(
    /(?:about|summary|professional summary|profile)\s*([\s\S]*?)(?=(work experience|experience|skills|education|certifications|references|\n[A-Z\s]{4,}\n))/i,
  );
  if (aboutMatch && aboutMatch[1]) {
    summary = aboutMatch[1].replace(/\n+/g, ' ').trim().slice(0, 1000);
  } else {
    summary = text.slice(0, 500).replace(/\n+/g, ' ').trim();
  }

  // Skills matching against canonical catalog
  const lowerText = text.toLowerCase();
  const matchedSkills: string[] = [];
  for (const slug of knownSkillSlugs) {
    const term = slug.replace(/-/g, ' ');
    if (lowerText.includes(term) || lowerText.includes(slug)) {
      matchedSkills.push(slug);
    }
  }

  // Experience extraction
  const experience: ParsedResume['experience'] = [];
  const expMatch = text.match(
    /(?:work experience|experience)\s*([\s\S]*?)(?=(education|certifications|skills|references|languages|personal details))/i,
  );
  if (expMatch && expMatch[1]) {
    const expBlock = expMatch[1];
    const sections = expBlock.split(
      /(?=\n[A-Z0-9\s-]{3,40}\n(?:[A-Za-z\s]+)?\n?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}))/i,
    );
    for (const sec of sections) {
      const sLines = sec
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (sLines.length >= 2) {
        const company = sLines[0];
        if (!company) continue;
        const dateMatch = sec.match(
          /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})[a-z0-9\s–-]+(Present|\d{4})/i,
        );
        const titleMatch = sLines.find((l) =>
          /engineer|developer|partner|intern|maintainer|manager|lead|architect|consultant|analyst/i.test(
            l,
          ),
        );
        if (titleMatch || dateMatch) {
          experience.push({
            company: company.slice(0, 80),
            title: titleMatch ? titleMatch.slice(0, 80) : 'Software Engineer',
            startDate: dateMatch ? (dateMatch[1] ?? null) : null,
            endDate: dateMatch ? (dateMatch[2] ?? null) : null,
            description: sLines.slice(2).join(' ').slice(0, 500) || null,
          });
        }
      }
    }
  }

  // Education extraction
  const education: ParsedResume['education'] = [];
  const eduMatch = text.match(
    /education\s*([\s\S]*?)(?=(certifications|references|skills|experience|$))/i,
  );
  if (eduMatch && eduMatch[1]) {
    const eduBlock = eduMatch[1];
    const eduLines = eduBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    for (let i = 0; i < eduLines.length; i++) {
      const line = eduLines[i];
      if (line && /university|college|school|institute/i.test(line)) {
        const school = line;
        const degLine =
          eduLines.find(
            (l, idx) => idx > i && /bachelor|master|phd|diploma|certificate|degree|bsc|ba/i.test(l),
          ) || null;
        const years = (
          (eduLines[i + 1] || '') +
          ' ' +
          (eduLines[i + 2] || '')
        ).match(/\b(20\d\d|19\d\d)\b.*?(\b(20\d\d|present|expected\s+20\d\d)\b)?/i);
        education.push({
          school: school.slice(0, 100),
          degree: degLine ? degLine.slice(0, 80) : null,
          field: degLine && degLine.includes('in ') ? (degLine.split('in ')[1]?.slice(0, 80) ?? null) : null,
          startYear: years && years[1] ? parseInt(years[1], 10) : null,
          endYear: years && years[3] && !isNaN(parseInt(years[3], 10)) ? parseInt(years[3], 10) : null,
        });
      }
    }
  }

  // Certifications extraction
  const certifications: string[] = [];
  const certMatch = text.match(
    /certifications\s*([\s\S]*?)(?=(education|references|skills|experience|$))/i,
  );
  if (certMatch && certMatch[1]) {
    const cLines = certMatch[1]
      .split('\n')
      .map((l) => l.trim().replace(/^PLANNED\s*/i, ''))
      .filter((l) => l.length > 5 && !/^[▸•-]$/.test(l));
    certifications.push(...cLines.slice(0, 10));
  }

  // Calculate yearsExperience from earliest date
  const allYears = Array.from(text.matchAll(/\b(19\d\d|20\d\d)\b/g))
    .map((m) => parseInt(m[0], 10))
    .filter((y) => y >= 1990 && y <= new Date().getFullYear());
  const earliestYear = allYears.length > 0 ? Math.min(...allYears) : null;
  const yearsExperience = earliestYear
    ? Math.min(new Date().getFullYear() - earliestYear, 70)
    : null;

  return {
    fullName,
    email,
    phone,
    headline,
    yearsExperience,
    summary,
    skills: matchedSkills.slice(0, 40),
    experience: experience.slice(0, 20),
    education: education.slice(0, 10),
    certifications: certifications.slice(0, 20),
  };
}

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
    await writeEmbedding(
      resumeId,
      stored.summary ?? JSON.stringify(resume.parsedJson).slice(0, 8000),
    );
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
    logger.warn(
      { resumeId, declared: resume.fileMime, detected: detected?.mime },
      'mime mismatch — rejecting',
    );
    await db.resume.update({ where: { id: resumeId }, data: { deletedAt: new Date() } });
    throw new Error('Mime mismatch');
  }

  // 3. Extract text
  const text = await extractText(bytes, detected.mime);
  if (text.length < 30) throw new Error('Resume text too short to parse');

  // 4. Structured parse via Haiku (with robust heuristic fallback if AI Gateway is unavailable)
  let parsed: ParsedResume;
  try {
    const { object } = await generateObject({
      model: gateway(MODELS.haiku),
      schema: ResumeSchema,
      system: RESUME_PARSE_SYSTEM,
      prompt: text.slice(0, 80_000),
      temperature: 0,
    });
    parsed = object;
  } catch (aiErr) {
    logger.warn({ err: aiErr, resumeId }, 'AI Gateway unavailable, using heuristic resume parser');
    const allSkills = await db.skill.findMany({ select: { slug: true } });
    parsed = heuristicParseResume(text, allSkills.map((s) => s.slug));
  }

  // 5. Persist parsedJson first: if the embedding step fails, the stored parse
  //    lets the reconcile sweep repair the embedding without a second Haiku call.
  await db.resume.update({
    where: { id: resumeId },
    data: { parsedJson: parsed as unknown as Prisma.InputJsonValue },
  });

  // 6. Embedding for match score (safe against unconfigured embedding model)
  try {
    await writeEmbedding(resumeId, parsed.summary ?? text.slice(0, 8000));
  } catch (embedErr) {
    logger.warn(
      { err: embedErr, resumeId },
      'Resume embedding skipped (AI Gateway embedding model unavailable)',
    );
  }

  // 7. Link skills from the parsed list against our canonical Skill catalog.
  if (parsed.skills.length > 0) {
    const slugs = parsed.skills.map((s) =>
      s
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    );
    const matched = await db.skill.findMany({ where: { slug: { in: slugs } } });
    const profile = await db.jobSeekerProfile.findUnique({ where: { userId: resume.userId } });
    if (profile) {
      for (const skill of matched) {
        await db.jobSeekerSkill.upsert({
          where: {
            jobSeekerProfileId_skillId: { jobSeekerProfileId: profile.id, skillId: skill.id },
          },
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
    return result.text.replace(/\0/g, '').trim();
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  ) {
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value.replace(/\0/g, '').trim();
  }
  throw new Error(`Unsupported mime ${mime}`);
}
