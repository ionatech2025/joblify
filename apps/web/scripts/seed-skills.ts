/* eslint-disable no-console */
// Seed the `skills` table with a starter taxonomy. Full ESCO import (~13k
// skills) lands when search relevance demands it; this set covers the top
// roles a beta job board sees.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const STARTER_SKILLS: Array<{ slug: string; label: string; aliases: string[] }> = [
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

async function main() {
  for (const skill of STARTER_SKILLS) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      create: skill,
      update: { label: skill.label, aliases: skill.aliases },
    });
  }
  console.log(`Seeded ${STARTER_SKILLS.length} skills.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
