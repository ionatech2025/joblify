import type { ParsedResume } from '@/lib/ai/prompts/resume-parse';

/**
 * Regex-based resume parser used when the model call is unavailable.
 *
 * It is a *degraded* mode and the rest of the system is told so: the workflow
 * stamps the result `_source: 'heuristic'`, and the reconcile sweep re-parses
 * those rows with the model once it is reachable again. Because the output can
 * end up on a candidate's profile and in front of a recruiter, it follows one
 * rule above all others — **leave a field empty rather than invent it**:
 *
 *   - an experience entry needs a job title that is actually present in the
 *     text (it used to default to "Software Engineer", fabricating a role for
 *     every candidate whose title the regex missed);
 *   - `yearsExperience` is derived from the dates of the experience entries it
 *     found, not from the earliest 4-digit number anywhere in the document
 *     (which turned "Founded 1994" or a postcode into a career length).
 */

const MONTH = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?';
const DATE_TOKEN = `(?:${MONTH}\\s+\\d{4}|\\d{4})`;
const END_TOKEN = `(?:${DATE_TOKEN}|Present|Current|Now|Ongoing)`;
const DATE_RANGE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:–|—|-|to)\\s*(?:Expected\\s+)?(${END_TOKEN})`,
  'i',
);

const TITLE_WORDS =
  /engineer|developer|designer|manager|specialist|lead|consultant|architect|officer|coordinator|director|intern|partner|practitioner|founder|analyst|maintainer|administrator|scientist|technician|assistant|executive/i;

function yearOf(token: string | null | undefined): number | null {
  if (!token) return null;
  const m = token.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

export function heuristicParseResume(text: string, knownSkillSlugs: string[] = []): ParsedResume {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);

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

  const isJobTitle = (s: string) => TITLE_WORDS.test(s);

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
      if (sLines.length < 2) continue;
      const company = sLines[0];
      if (!company) continue;

      const range = sec.match(DATE_RANGE);
      const titleLine = sLines.find((l, idx) => idx > 0 && !DATE_RANGE.test(l) && isJobTitle(l));

      // No title in the text → no entry. Never substitute a plausible one.
      if (!titleLine) continue;

      experience.push({
        company: company.slice(0, 80),
        title: titleLine.slice(0, 80),
        startDate: range ? (range[1] ?? null) : null,
        endDate: range ? (range[2] ?? null) : null,
        description: sLines.slice(2).join(' ').slice(0, 500) || null,
      });
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
        const years = ((eduLines[i + 1] || '') + ' ' + (eduLines[i + 2] || '')).match(
          /\b(20\d\d|19\d\d)\b.*?(\b(20\d\d|present|expected\s+20\d\d)\b)?/i,
        );
        education.push({
          school: school.slice(0, 100),
          degree: degLine ? degLine.slice(0, 80) : null,
          field:
            degLine && degLine.includes('in ')
              ? (degLine.split('in ')[1]?.slice(0, 80) ?? null)
              : null,
          startYear: years && years[1] ? parseInt(years[1], 10) : null,
          endYear:
            years && years[3] && !isNaN(parseInt(years[3], 10)) ? parseInt(years[3], 10) : null,
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

  return {
    fullName,
    email,
    phone,
    headline,
    yearsExperience: yearsFromExperience(experience),
    summary,
    skills: matchedSkills.slice(0, 40),
    experience: experience.slice(0, 20),
    education: education.slice(0, 10),
    certifications: certifications.slice(0, 20),
  };
}

/**
 * Whole years between the earliest start and the latest end among the entries
 * that carry real dates. `null` (unknown) when there are none — the caller
 * must not guess.
 */
export function yearsFromExperience(
  entries: Array<{ startDate: string | null; endDate: string | null }>,
  now: Date = new Date(),
): number | null {
  const thisYear = now.getFullYear();
  let start: number | null = null;
  let end: number | null = null;

  for (const e of entries) {
    const s = yearOf(e.startDate);
    if (s === null || s > thisYear) continue;
    const endToken = e.endDate ?? '';
    const ongoing = /present|current|now|ongoing/i.test(endToken);
    const eYear = ongoing ? thisYear : yearOf(endToken);
    if (eYear === null || eYear < s) continue;
    start = start === null ? s : Math.min(start, s);
    end = end === null ? Math.min(eYear, thisYear) : Math.max(end, Math.min(eYear, thisYear));
  }

  if (start === null || end === null) return null;
  return Math.min(Math.max(end - start, 0), 70);
}
