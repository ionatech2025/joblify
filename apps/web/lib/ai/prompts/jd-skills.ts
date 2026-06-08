import { z } from 'zod';

export const JdSkillsSchema = z.object({
  requiredSkills: z.array(z.string()).max(15),
  niceToHave: z.array(z.string()).max(15),
  seniority: z.enum(['ENTRY', 'MID', 'SENIOR', 'STAFF', 'EXECUTIVE']),
});

export type JdSkills = z.infer<typeof JdSkillsSchema>;

export const JD_SKILLS_SYSTEM = `You extract required skills from a job description.
Return JSON matching the schema exactly.
- Skills are short noun phrases.
- Distinguish required from nice-to-have based on phrasing.
- Cap each list at 15 items.
- Map seniority from years of experience, role title, and scope.`;
