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

  const skills = await prisma.skill.findMany({
    where: { slug: { in: j.skills } },
    select: { id: true },
  });
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
    create: {
      clerkUserId: 'demo_company',
      email: 'demo-company@joblify.example',
      userType: 'COMPANY',
    },
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

  await seedWorkflows(company.id);
}

// Demo data for the flowchart / use-case flows (JOB_UC_05/07/10/11): a couple
// of directory-visible seekers (one per profile type), their subscriptions, a
// pending typed invitation, a job chat area and the company virtual-intern chat
// area (each with participants + messages), and the notifications the flows
// produce. Idempotent — upserts key on the same unique constraints the Server
// Actions use; chat messages / notifications carry fixed ids so re-runs don't
// duplicate them.
async function upsertSeeker(opts: {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: {
    profileType: 'EMPLOYABLE' | 'VIRTUAL_INTERN';
    headline?: string;
    bio?: string;
    yearsExperience?: number | null;
    location?: string;
    desiredWorkMode?: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
    careerInterest?: string | null;
    availabilityHoursPerWeek?: number | null;
    learningGoal?: string | null;
  };
}): Promise<{ id: string }> {
  const user = await prisma.user.upsert({
    where: { clerkUserId: opts.clerkUserId },
    create: {
      clerkUserId: opts.clerkUserId,
      email: opts.email,
      userType: 'JOB_SEEKER',
      firstName: opts.firstName,
      lastName: opts.lastName,
    },
    update: { firstName: opts.firstName, lastName: opts.lastName },
    select: { id: true },
  });

  const p = opts.profile;
  await prisma.jobSeekerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      profileType: p.profileType,
      headline: p.headline ?? null,
      bio: p.bio ?? null,
      yearsExperience: p.yearsExperience ?? null,
      location: p.location ?? null,
      desiredWorkMode: p.desiredWorkMode ?? null,
      // PUBLIC so the seeker shows in the "All" jobseeker directory tab.
      visibility: 'PUBLIC',
      careerInterest: p.careerInterest ?? null,
      availabilityHoursPerWeek: p.availabilityHoursPerWeek ?? null,
      learningGoal: p.learningGoal ?? null,
    },
    update: { profileType: p.profileType, visibility: 'PUBLIC' },
  });

  return user;
}

async function joinChat(chatAreaId: string, userId: string): Promise<void> {
  await prisma.chatParticipant.upsert({
    where: { chatAreaId_userId: { chatAreaId, userId } },
    create: { chatAreaId, userId },
    update: {},
  });
}

async function seedWorkflows(companyId: string): Promise<void> {
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: companyId },
    select: { companyName: true },
  });
  const companyName = companyProfile?.companyName ?? 'Acme Inc';

  const ada = await upsertSeeker({
    clerkUserId: 'demo_seeker_employable',
    email: 'demo-seeker-employable@joblify.example',
    firstName: 'Ada',
    lastName: 'Lovelace',
    profile: {
      profileType: 'EMPLOYABLE',
      headline: 'Full-stack engineer — TypeScript & React',
      bio: 'Six years building product web apps end to end.',
      yearsExperience: 6,
      location: 'Berlin, DE',
      desiredWorkMode: 'HYBRID',
    },
  });

  const grace = await upsertSeeker({
    clerkUserId: 'demo_seeker_intern',
    email: 'demo-seeker-intern@joblify.example',
    firstName: 'Grace',
    lastName: 'Hopper',
    profile: {
      profileType: 'VIRTUAL_INTERN',
      headline: 'Aspiring data engineer',
      location: 'Remote (EU)',
      careerInterest: 'Data engineering',
      availabilityHoursPerWeek: 15,
      learningGoal: 'Ship a production data pipeline with SQL and Python.',
    },
  });

  // Subscriptions (JOB_UC_07): one per type, matching each seeker's profile.
  for (const [jobSeekerId, profileType] of [
    [ada.id, 'EMPLOYABLE'],
    [grace.id, 'VIRTUAL_INTERN'],
  ] as const) {
    await prisma.companySubscription.upsert({
      where: { companyId_jobSeekerId_profileType: { companyId, jobSeekerId, profileType } },
      create: { companyId, jobSeekerId, profileType },
      update: {},
    });
  }

  // A pending typed invitation (JOB_UC_10): Ada invited to also join as a
  // virtual intern; unanswered so the seeker's inbox shows the accept/decline UI.
  await prisma.invitation.upsert({
    where: {
      companyId_jobSeekerId_profileType: {
        companyId,
        jobSeekerId: ada.id,
        profileType: 'VIRTUAL_INTERN',
      },
    },
    create: {
      companyId,
      jobSeekerId: ada.id,
      profileType: 'VIRTUAL_INTERN',
      status: 'PENDING',
      message: `${companyName} would love to have you as a virtual intern.`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {},
  });

  // Job-specific chat area (JOB_UC_11) on the React role; company + Ada joined.
  const job = await prisma.jobPost.findUnique({
    where: { slug: 'frontend-engineer-react' },
    select: { id: true, title: true },
  });
  if (job) {
    const jobArea = await prisma.chatArea.upsert({
      where: { jobPostId: job.id },
      create: { kind: 'JOB', companyId, jobPostId: job.id, title: job.title },
      update: {},
      select: { id: true },
    });
    await joinChat(jobArea.id, companyId);
    await joinChat(jobArea.id, ada.id);
    await prisma.chatMessage.upsert({
      where: { id: 'a1a1a1a1-0000-4000-8000-000000000001' },
      create: {
        id: 'a1a1a1a1-0000-4000-8000-000000000001',
        chatAreaId: jobArea.id,
        senderId: companyId,
        kind: 'TEXT',
        body: 'Hi Ada — thanks for applying! A few questions before we schedule a call.',
      },
      update: {},
    });
    await prisma.chatMessage.upsert({
      where: { id: 'a1a1a1a1-0000-4000-8000-000000000002' },
      create: {
        id: 'a1a1a1a1-0000-4000-8000-000000000002',
        chatAreaId: jobArea.id,
        senderId: ada.id,
        kind: 'TEXT',
        body: 'Thanks! Happy to chat — I’m free most afternoons this week.',
      },
      update: {},
    });
  }

  // Company's single virtual-intern chat area; company + Grace joined. No unique
  // key Prisma can target (a partial index enforces one-per-company), so
  // find-then-create like the Server Action does.
  let viArea = await prisma.chatArea.findFirst({
    where: { companyId, kind: 'VIRTUAL_INTERN' },
    select: { id: true },
  });
  if (!viArea) {
    viArea = await prisma.chatArea.create({
      data: { kind: 'VIRTUAL_INTERN', companyId, title: `${companyName} · Virtual interns` },
      select: { id: true },
    });
  }
  await joinChat(viArea.id, companyId);
  await joinChat(viArea.id, grace.id);
  await prisma.chatMessage.upsert({
    where: { id: 'a1a1a1a1-0000-4000-8000-000000000003' },
    create: {
      id: 'a1a1a1a1-0000-4000-8000-000000000003',
      chatAreaId: viArea.id,
      senderId: companyId,
      kind: 'INTERVIEW_DETAILS',
      body: 'Welcome to the virtual-intern cohort! Orientation call Friday 3pm CET.',
    },
    update: {},
  });

  // In-app notifications these flows would have produced.
  await prisma.notification.upsert({
    where: { id: 'b2b2b2b2-0000-4000-8000-000000000001' },
    create: {
      id: 'b2b2b2b2-0000-4000-8000-000000000001',
      userId: companyId,
      kind: 'NEW_SUBSCRIBER',
      payload: {
        jobSeekerId: ada.id,
        profileType: 'EMPLOYABLE',
        message: `Ada Lovelace subscribed to ${companyName} as employable.`,
      },
    },
    update: {},
  });
  await prisma.notification.upsert({
    where: { id: 'b2b2b2b2-0000-4000-8000-000000000002' },
    create: {
      id: 'b2b2b2b2-0000-4000-8000-000000000002',
      userId: ada.id,
      kind: 'INVITATION_RECEIVED',
      payload: {
        profileType: 'VIRTUAL_INTERN',
        message: `${companyName} invited you to subscribe as a virtual intern.`,
      },
    },
    update: {},
  });
}

async function main() {
  const n = await seedSkills();
  console.log(`Seeded ${n} skills.`);

  if (process.env.SEED_DEMO === '1' || process.env.SEED_DEMO === 'true') {
    await seedDemo();
    console.log(
      'Seeded demo data (1 company, 2 jobs, 2 seekers, subscriptions, 1 pending invitation, 2 chat areas + messages, notifications).',
    );
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
