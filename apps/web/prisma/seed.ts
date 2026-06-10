/* eslint-disable no-console */
// Reproducible database seed — run via `prisma db seed` (or `bun run db:seed`).
//
//   • Skills (the reference taxonomy) are seeded in EVERY environment — search /
//     match / JD skill-extraction match against them.
//   • Demo data (a company + jobs) is seeded only when SEED_DEMO is set, so a
//     production seed never injects fake listings.
//
// Idempotent throughout (upserts keyed on stable unique fields), so it's safe to
// re-run.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SKILLS: Array<{ slug: string; label: string; aliases: string[] }> = [
  { slug: 'javascript', label: 'JavaScript', aliases: ['js'] },
  { slug: 'typescript', label: 'TypeScript', aliases: ['ts'] },
  { slug: 'react', label: 'React', aliases: ['reactjs', 'react.js'] },
  { slug: 'nextjs', label: 'Next.js', aliases: ['next', 'next.js'] },
  { slug: 'node', label: 'Node.js', aliases: ['nodejs', 'node.js'] },
  { slug: 'python', label: 'Python', aliases: ['py'] },
  { slug: 'django', label: 'Django', aliases: [] },
  { slug: 'fastapi', label: 'FastAPI', aliases: [] },
  { slug: 'java', label: 'Java', aliases: [] },
  { slug: 'kotlin', label: 'Kotlin', aliases: [] },
  { slug: 'swift', label: 'Swift', aliases: [] },
  { slug: 'go', label: 'Go', aliases: ['golang'] },
  { slug: 'rust', label: 'Rust', aliases: [] },
  { slug: 'sql', label: 'SQL', aliases: [] },
  { slug: 'postgres', label: 'PostgreSQL', aliases: ['postgresql', 'postgres'] },
  { slug: 'mongodb', label: 'MongoDB', aliases: ['mongo'] },
  { slug: 'redis', label: 'Redis', aliases: [] },
  { slug: 'docker', label: 'Docker', aliases: [] },
  { slug: 'kubernetes', label: 'Kubernetes', aliases: ['k8s'] },
  { slug: 'aws', label: 'AWS', aliases: ['amazon web services'] },
  { slug: 'gcp', label: 'Google Cloud', aliases: ['gcp', 'google cloud platform'] },
  { slug: 'azure', label: 'Azure', aliases: ['microsoft azure'] },
  { slug: 'terraform', label: 'Terraform', aliases: [] },
  { slug: 'figma', label: 'Figma', aliases: [] },
  { slug: 'product-management', label: 'Product Management', aliases: ['pm'] },
  { slug: 'project-management', label: 'Project Management', aliases: [] },
  { slug: 'agile', label: 'Agile', aliases: ['scrum'] },
  { slug: 'data-analysis', label: 'Data Analysis', aliases: [] },
  { slug: 'machine-learning', label: 'Machine Learning', aliases: ['ml'] },
  { slug: 'communication', label: 'Communication', aliases: [] },
  { slug: 'leadership', label: 'Leadership', aliases: [] },
];

async function seedSkills(): Promise<number> {
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      create: skill,
      update: { label: skill.label, aliases: skill.aliases },
    });
  }
  return SKILLS.length;
}

async function upsertJob(
  companyId: string,
  j: {
    slug: string;
    title: string;
    description: string;
    requirements: string;
    experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'STAFF' | 'EXECUTIVE';
    workMode: 'REMOTE' | 'HYBRID' | 'ONSITE';
    location: string;
    salaryMin: number;
    salaryMax: number;
    skills: string[];
  },
): Promise<void> {
  const job = await prisma.jobPost.upsert({
    where: { slug: j.slug },
    create: {
      slug: j.slug,
      companyId,
      title: j.title,
      description: j.description,
      requirements: j.requirements,
      industry: 'TECHNOLOGY',
      jobType: 'FULL_TIME',
      experienceLevel: j.experienceLevel,
      workMode: j.workMode,
      location: j.location,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      salaryCurrency: 'EUR',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    update: { title: j.title, description: j.description, status: 'PUBLISHED' },
  });

  const skills = await prisma.skill.findMany({ where: { slug: { in: j.skills } }, select: { id: true } });
  for (const s of skills) {
    await prisma.jobPostSkill.upsert({
      where: { jobPostId_skillId: { jobPostId: job.id, skillId: s.id } },
      create: { jobPostId: job.id, skillId: s.id, weight: 2 },
      update: { weight: 2 },
    });
  }
}

async function seedDemo(): Promise<void> {
  const company = await prisma.user.upsert({
    where: { clerkUserId: 'demo_company' },
    create: { clerkUserId: 'demo_company', email: 'demo-company@joblify.example', userType: 'COMPANY' },
    update: {},
  });

  await prisma.companyProfile.upsert({
    where: { userId: company.id },
    create: {
      userId: company.id,
      slug: 'acme-inc',
      companyName: 'Acme Inc',
      industry: 'TECHNOLOGY',
      companySize: 'SIZE_11_50',
      description: 'We build delightful developer tools.',
      verificationStatus: 'VERIFIED',
    },
    update: {},
  });

  await upsertJob(company.id, {
    slug: 'senior-rust-engineer',
    title: 'Senior Rust Engineer',
    description: 'Build fast, reliable distributed systems in Rust. Own services end to end.',
    requirements: '5+ years backend; Rust or Go; Postgres.',
    experienceLevel: 'SENIOR',
    workMode: 'REMOTE',
    location: 'Remote (EU)',
    salaryMin: 120000,
    salaryMax: 160000,
    skills: ['rust', 'go', 'postgres'],
  });

  await upsertJob(company.id, {
    slug: 'frontend-engineer-react',
    title: 'Frontend Engineer (React)',
    description: 'Craft accessible, fast UIs with React, Next.js and TypeScript.',
    requirements: '3+ years React; TypeScript; an eye for design.',
    experienceLevel: 'MID',
    workMode: 'HYBRID',
    location: 'Berlin, DE',
    salaryMin: 70000,
    salaryMax: 95000,
    skills: ['react', 'typescript', 'nextjs'],
  });
}

async function main() {
  const n = await seedSkills();
  console.log(`Seeded ${n} skills.`);

  if (process.env.SEED_DEMO === '1' || process.env.SEED_DEMO === 'true') {
    await seedDemo();
    console.log('Seeded demo data (1 company, 2 jobs).');
  } else {
    console.log('Skipped demo data (set SEED_DEMO=1 to include it).');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
