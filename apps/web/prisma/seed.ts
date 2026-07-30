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
import { embed } from 'ai';
import { gateway, MODELS } from '@/lib/ai/gateway';

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
  await seedAdminAndPendingCompany();
}

// JOB_UC_06.0 / admin capability: an ADMIN user (so the /admin verification
// queue has a reviewer to attribute audit events to) and a second company on
// the FREE plan with verificationStatus PENDING — Acme Inc is already
// VERIFIED, so without this there's nothing for the queue to review and no
// FREE-plan company to demo the premium-outreach gates against. No jobs are
// seeded for this company: an unverified company's jobs aren't meant to be
// publicly visible, so a lean profile-only row keeps the demo honest.
async function seedAdminAndPendingCompany(): Promise<void> {
  await prisma.user.upsert({
    where: { clerkUserId: 'demo_admin' },
    create: {
      clerkUserId: 'demo_admin',
      email: 'demo-admin@joblify.example',
      userType: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Reviewer',
    },
    update: {},
  });

  const pendingCompany = await prisma.user.upsert({
    where: { clerkUserId: 'demo_company_pending' },
    create: {
      clerkUserId: 'demo_company_pending',
      email: 'demo-company-pending@joblify.example',
      userType: 'COMPANY',
      plan: 'FREE',
    },
    update: { plan: 'FREE' },
  });

  await prisma.companyProfile.upsert({
    where: { userId: pendingCompany.id },
    create: {
      userId: pendingCompany.id,
      slug: 'nimbus-labs',
      companyName: 'Nimbus Labs',
      industry: 'TECHNOLOGY',
      companySize: 'SIZE_1_10',
      description: 'A newly registered company awaiting verification.',
      verificationStatus: 'PENDING',
    },
    update: { verificationStatus: 'PENDING' },
  });
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
  plan?: 'FREE' | 'PRO';
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
    education?: string | null;
    certifications?: string | null;
    portfolioUrl?: string | null;
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
      ...(opts.plan ? { plan: opts.plan } : {}),
    },
    update: {
      firstName: opts.firstName,
      lastName: opts.lastName,
      ...(opts.plan ? { plan: opts.plan } : {}),
    },
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
      education: p.education ?? null,
      certifications: p.certifications ?? null,
      portfolioUrl: p.portfolioUrl ?? null,
    },
    update: {
      profileType: p.profileType,
      visibility: 'PUBLIC',
      education: p.education ?? null,
      certifications: p.certifications ?? null,
      portfolioUrl: p.portfolioUrl ?? null,
    },
  });

  return user;
}

// JOB_UC_05.0: link a jobseeker to a few catalog skills (proficiency/years
// default to the schema defaults), and give them WorkExperience rows (the
// resume-builder's source data). Reset-and-recreate, matching the idempotent
// shape the real Server Actions use (saveProfile / saveWorkExperiences).
async function seedSkillsAndExperience(
  jobSeekerUserId: string,
  skillSlugs: string[],
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }>,
): Promise<void> {
  const profile = await prisma.jobSeekerProfile.findUniqueOrThrow({
    where: { userId: jobSeekerUserId },
    select: { id: true },
  });

  const skills = await prisma.skill.findMany({ where: { slug: { in: skillSlugs } } });
  await prisma.jobSeekerSkill.deleteMany({ where: { jobSeekerProfileId: profile.id } });
  if (skills.length > 0) {
    await prisma.jobSeekerSkill.createMany({
      data: skills.map((s) => ({ jobSeekerProfileId: profile.id, skillId: s.id })),
      skipDuplicates: true,
    });
  }

  await prisma.workExperience.deleteMany({ where: { jobSeekerProfileId: profile.id } });
  if (experience.length > 0) {
    await prisma.workExperience.createMany({
      data: experience.map((e) => ({ jobSeekerProfileId: profile.id, ...e })),
    });
  }
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
    plan: 'PRO',
    profile: {
      profileType: 'EMPLOYABLE',
      headline: 'Full-stack engineer — TypeScript & React',
      bio: 'Six years building product web apps end to end.',
      yearsExperience: 6,
      location: 'Berlin, DE',
      desiredWorkMode: 'HYBRID',
      education: 'B.Sc. Computer Science, Humboldt University of Berlin',
      certifications: 'AWS Certified Solutions Architect – Associate',
      portfolioUrl: 'https://github.com/ada-lovelace-demo',
    },
  });
  await seedSkillsAndExperience(
    ada.id,
    ['typescript', 'react', 'nextjs', 'node', 'postgres'],
    [
      {
        company: 'Byte Foundry',
        title: 'Senior Full-Stack Engineer',
        startDate: 'Jan 2022',
        endDate: 'Present',
        description:
          'Lead a small team building the core product in React, Next.js and TypeScript; introduced CI-driven end-to-end testing.',
      },
      {
        company: 'Nimbus Cloud',
        title: 'Full-Stack Engineer',
        startDate: 'Jun 2018',
        endDate: 'Dec 2021',
        description:
          'Built and scaled a Node.js/PostgreSQL API serving millions of monthly requests.',
      },
    ],
  );

  // Grace is deliberately on the FREE plan — the only seeded account that is,
  // so the upgrade banner on /jobseeker/applications and the company-side
  // premium gates have a real FREE account to demo against (every other
  // seeded account defaults to PRO).
  const grace = await upsertSeeker({
    clerkUserId: 'demo_seeker_intern',
    email: 'demo-seeker-intern@joblify.example',
    firstName: 'Grace',
    lastName: 'Hopper',
    plan: 'FREE',
    profile: {
      profileType: 'VIRTUAL_INTERN',
      headline: 'Aspiring data engineer',
      location: 'Remote (EU)',
      careerInterest: 'Data engineering',
      availabilityHoursPerWeek: 15,
      learningGoal: 'Ship a production data pipeline with SQL and Python.',
      education: 'B.Sc. Data Science (in progress), Open University',
      portfolioUrl: 'https://github.com/grace-hopper-demo',
    },
  });
  await seedSkillsAndExperience(
    grace.id,
    ['python', 'sql', 'data-analysis'],
    [
      {
        company: 'Freelance',
        title: 'Data Analysis Projects (self-directed)',
        startDate: '2025',
        endDate: 'Present',
        description:
          'Built small ETL pipelines and dashboards using Python and SQL as self-directed learning projects.',
      },
    ],
  );

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
  const invitation = await prisma.invitation.upsert({
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
    select: { id: true },
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
        invitationId: invitation.id,
        profileType: 'VIRTUAL_INTERN',
        message: `${companyName} invited you to subscribe as a virtual intern.`,
      },
    },
    update: {},
  });

  await seedJobseekerActivity(ada, grace, companyName);
}

// Demo data for the remaining features (applications, resumes, saved jobs/
// searches): Ada applied for the React role (shortlisted, so her application
// list and the company's applicant view both have something to show) and
// bookmarked the Rust role; Grace bookmarked the React role. Notification
// kinds here are restricted to ones a real Server Action actually produces
// (update-applicant-status.ts / chat.ts) — APPLICATION_SUBMITTED and
// NEW_APPLICANT exist in the enum and in notifications-list.tsx's label map,
// but no action creates them yet, so seeding them would misrepresent behavior.
async function seedJobseekerActivity(
  ada: { id: string },
  grace: { id: string },
  companyName: string,
): Promise<void> {
  const [reactJob, rustJob] = await Promise.all([
    prisma.jobPost.findUnique({
      where: { slug: 'frontend-engineer-react' },
      select: { id: true, title: true },
    }),
    prisma.jobPost.findUnique({
      where: { slug: 'senior-rust-engineer' },
      select: { id: true, title: true },
    }),
  ]);
  if (!reactJob || !rustJob) return;

  await seedJobViews(ada, grace, reactJob.id, rustJob.id);

  const adaResume = await prisma.resume.upsert({
    where: { id: 'c3c3c3c3-0000-4000-8000-000000000001' },
    create: {
      id: 'c3c3c3c3-0000-4000-8000-000000000001',
      userId: ada.id,
      title: 'Ada Lovelace — Resume.pdf',
      fileBlobUrl:
        'https://demo-blob.public.blob.vercel-storage.com/resumes/ada-lovelace-resume.pdf',
      fileMime: 'application/pdf',
      fileSizeBytes: 214_300,
      isDefault: true,
    },
    update: {},
  });
  await prisma.resume.upsert({
    where: { id: 'c3c3c3c3-0000-4000-8000-000000000002' },
    create: {
      id: 'c3c3c3c3-0000-4000-8000-000000000002',
      userId: grace.id,
      title: 'Grace Hopper — Resume.pdf',
      fileBlobUrl:
        'https://demo-blob.public.blob.vercel-storage.com/resumes/grace-hopper-resume.pdf',
      fileMime: 'application/pdf',
      fileSizeBytes: 198_700,
      isDefault: true,
    },
    update: {},
  });

  // Real embeddings (not fake vectors) so /jobseeker/matches has something
  // genuine to rank for the demo account — best-effort, since it needs a
  // live AI Gateway call (see seedEmbeddings' own doc comment).
  await seedEmbeddings(adaResume.id, reactJob.id);

  // Ada: shortlisted for the React role (drives the applicant-status +
  // applications-list demos) and a fresh application to the Rust role.
  await prisma.jobApplication.upsert({
    where: { jobPostId_jobSeekerId: { jobPostId: reactJob.id, jobSeekerId: ada.id } },
    create: {
      jobPostId: reactJob.id,
      jobSeekerId: ada.id,
      resumeId: adaResume.id,
      status: 'SHORTLISTED',
      coverLetter:
        "I've shipped production React/TypeScript UIs for six years and would love to help here.",
      recruiterNotes: 'Strong portfolio; scheduling a call.',
      matchScore: 0.82,
    },
    update: { status: 'SHORTLISTED' },
  });
  await prisma.jobApplication.upsert({
    where: { jobPostId_jobSeekerId: { jobPostId: rustJob.id, jobSeekerId: ada.id } },
    create: {
      jobPostId: rustJob.id,
      jobSeekerId: ada.id,
      resumeId: adaResume.id,
      status: 'SUBMITTED',
      matchScore: 0.41,
    },
    update: {},
  });

  // Saved jobs (Ada bookmarks the Rust role; Grace bookmarks the React role).
  await prisma.savedJob.upsert({
    where: { userId_jobPostId: { userId: ada.id, jobPostId: rustJob.id } },
    create: { userId: ada.id, jobPostId: rustJob.id },
    update: {},
  });
  await prisma.savedJob.upsert({
    where: { userId_jobPostId: { userId: grace.id, jobPostId: reactJob.id } },
    create: { userId: grace.id, jobPostId: reactJob.id },
    update: {},
  });

  // Saved search (no natural unique key on the model — upsert on a fixed id).
  await prisma.savedSearch.upsert({
    where: { id: 'd4d4d4d4-0000-4000-8000-000000000001' },
    create: {
      id: 'd4d4d4d4-0000-4000-8000-000000000001',
      userId: ada.id,
      label: 'Remote React roles',
      query: 'q=react&workMode=REMOTE',
    },
    update: {},
  });

  // Notifications matching the shapes real actions produce (see the
  // function-level comment for why APPLICATION_SUBMITTED/NEW_APPLICANT are
  // deliberately not seeded).
  await prisma.notification.upsert({
    where: { id: 'b2b2b2b2-0000-4000-8000-000000000003' },
    create: {
      id: 'b2b2b2b2-0000-4000-8000-000000000003',
      userId: ada.id,
      kind: 'APPLICATION_STATUS_CHANGED',
      payload: {
        applicationId: (
          await prisma.jobApplication.findUniqueOrThrow({
            where: { jobPostId_jobSeekerId: { jobPostId: reactJob.id, jobSeekerId: ada.id } },
            select: { id: true },
          })
        ).id,
        jobTitle: reactJob.title,
        companyName,
        status: 'SHORTLISTED',
        message: 'Your application status changed to SHORTLISTED.',
      },
    },
    update: {},
  });
  const jobArea = await prisma.chatArea.findUnique({
    where: { jobPostId: reactJob.id },
    select: { id: true, title: true },
  });
  if (jobArea) {
    await prisma.notification.upsert({
      where: { id: 'b2b2b2b2-0000-4000-8000-000000000004' },
      create: {
        id: 'b2b2b2b2-0000-4000-8000-000000000004',
        userId: ada.id,
        kind: 'CHAT_AREA_ADDED',
        payload: {
          chatAreaId: jobArea.id,
          message: `You were added to the chat area "${jobArea.title}".`,
        },
      },
      update: {},
    });
  }
}

// Jobseeker view history (drives the "Recently viewed" panel on
// /jobseeker/applications, which reads JobView directly — see
// app/(authenticated)/jobseeker/recently-viewed.tsx). Fixed ids keep the
// upserts idempotent; ipHash mirrors the real /api/v1/jobs/[id]/view route's
// shape (a hash, never a real IP) with an obviously-fake placeholder.
// viewCount is set (not incremented) from the actual JobView row count for
// each job so re-running the seed never inflates it.
async function seedJobViews(
  ada: { id: string },
  grace: { id: string },
  reactJobId: string,
  rustJobId: string,
): Promise<void> {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const SEED_IP_HASH = 'seed0000000000000000000000000000';
  const views = [
    {
      id: 'e5e5e5e5-0000-4000-8000-000000000001',
      userId: ada.id,
      jobPostId: reactJobId,
      daysAgo: 4,
    },
    {
      id: 'e5e5e5e5-0000-4000-8000-000000000002',
      userId: ada.id,
      jobPostId: rustJobId,
      daysAgo: 3,
    },
    {
      id: 'e5e5e5e5-0000-4000-8000-000000000003',
      userId: ada.id,
      jobPostId: reactJobId,
      daysAgo: 1,
    },
    {
      id: 'e5e5e5e5-0000-4000-8000-000000000004',
      userId: grace.id,
      jobPostId: reactJobId,
      daysAgo: 2,
    },
  ];
  for (const v of views) {
    await prisma.jobView.upsert({
      where: { id: v.id },
      create: {
        id: v.id,
        jobPostId: v.jobPostId,
        userId: v.userId,
        ipHash: SEED_IP_HASH,
        createdAt: new Date(now - v.daysAgo * day),
      },
      update: {},
    });
  }
  for (const jobPostId of [reactJobId, rustJobId]) {
    const viewCount = await prisma.jobView.count({ where: { jobPostId } });
    await prisma.jobPost.update({ where: { id: jobPostId }, data: { viewCount } });
  }
}

// Real (not fabricated) embeddings for one demo resume + job post, so
// /jobseeker/matches has a genuine result to show instead of always
// rendering its empty state. Mirrors the exact write shape
// resume-parse.workflow.ts / match-score.workflow.ts use in production —
// same model, same `[v1,v2,...]::vector` literal — just triggered from the
// seed script instead of a real upload/publish event.
//
// Best-effort: skip (with a warning, not a failure) if AI_GATEWAY_API_KEY
// isn't configured, and skip re-computing if an embedding is already set —
// this is an idempotent seed re-run, not a workflow that should hit a paid
// API on every invocation.
const ADA_RESUME_TEXT = `Ada Lovelace — Full-Stack Engineer

SUMMARY
Full-stack engineer with six years shipping production web applications end
to end. Deep expertise in TypeScript, React, and Next.js on the frontend;
Node.js and PostgreSQL on the backend. Comfortable owning a feature from
design through deployment and observability.

EXPERIENCE
Senior Full-Stack Engineer — Byte Foundry (2022 – Present)
Lead a small team building the core product in React, Next.js, and
TypeScript. Introduced CI-driven end-to-end testing and cut deploy-related
incidents significantly.

Full-Stack Engineer — Nimbus Cloud (2018 – 2021)
Built and scaled a Node.js/PostgreSQL API serving millions of monthly
requests. Owned the migration from a monolith to a service-oriented backend.

EDUCATION
B.Sc. Computer Science, Humboldt University of Berlin

SKILLS
TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, AWS`;

async function seedEmbeddings(resumeId: string, jobPostId: string): Promise<void> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.warn('Skipping demo embeddings: AI_GATEWAY_API_KEY not set.');
    return;
  }

  try {
    const [resumeRow] = await prisma.$queryRaw<Array<{ hasEmbedding: boolean }>>`
      SELECT (embedding IS NOT NULL) AS "hasEmbedding" FROM resumes WHERE id = ${resumeId}::uuid
    `;
    if (!resumeRow?.hasEmbedding) {
      const { embedding } = await embed({
        model: gateway.textEmbeddingModel(MODELS.embeddingLarge),
        value: ADA_RESUME_TEXT,
      });
      await prisma.$executeRaw`
        UPDATE resumes SET embedding = ${`[${embedding.join(',')}]`}::vector WHERE id = ${resumeId}::uuid
      `;
    }

    const [jobRow] = await prisma.$queryRaw<Array<{ hasEmbedding: boolean }>>`
      SELECT (embedding IS NOT NULL) AS "hasEmbedding" FROM job_posts WHERE id = ${jobPostId}::uuid
    `;
    if (!jobRow?.hasEmbedding) {
      const job = await prisma.jobPost.findUniqueOrThrow({
        where: { id: jobPostId },
        select: { title: true, description: true, requirements: true },
      });
      const text = `${job.title}\n\n${job.description}\n\n${job.requirements ?? ''}`.slice(
        0,
        30_000,
      );
      const { embedding } = await embed({
        model: gateway.textEmbeddingModel(MODELS.embeddingLarge),
        value: text,
      });
      await prisma.$executeRaw`
        UPDATE job_posts SET embedding = ${`[${embedding.join(',')}]`}::vector WHERE id = ${jobPostId}::uuid
      `;
    }
  } catch (err) {
    console.warn('Skipping demo embeddings — AI Gateway call failed:', err);
  }
}

async function main() {
  const n = await seedSkills();
  console.log(`Seeded ${n} skills.`);

  if (process.env.SEED_DEMO === '1' || process.env.SEED_DEMO === 'true') {
    await seedDemo();
    console.log(
      'Seeded demo data (2 companies [1 verified/PRO, 1 pending/FREE], 1 admin, 2 jobs, 2 seekers [1 PRO, 1 FREE] ' +
        'with skills + work experience, subscriptions, 1 pending invitation, 2 chat areas + messages, notifications).',
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
