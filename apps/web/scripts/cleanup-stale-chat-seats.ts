/* eslint-disable no-console */
// Usage: bun run scripts/cleanup-stale-chat-seats.ts [--apply]
import { PrismaClient, type ApplicationStatus, type Prisma, type UserType } from '@prisma/client';
import { CHAT_JOIN_STATUSES } from '../lib/applications/transitions';

export type JobChatSeat = {
  chatAreaId: string;
  title: string;
  jobPostId: string;
  userId: string;
  userType: UserType;
  applicationStatus: ApplicationStatus | null;
};

export function isStaleSeat(seat: JobChatSeat): boolean {
  return (
    seat.userType === 'JOB_SEEKER' &&
    !(seat.applicationStatus !== null && CHAT_JOIN_STATUSES.includes(seat.applicationStatus))
  );
}

function stillStale(seat: JobChatSeat): Prisma.ChatParticipantWhereInput {
  return {
    chatAreaId: seat.chatAreaId,
    userId: seat.userId,
    user: {
      applications: {
        none: { jobPostId: seat.jobPostId, status: { in: [...CHAT_JOIN_STATUSES] } },
      },
    },
  };
}

async function main(apply: boolean): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const seats = await prisma.$queryRaw<JobChatSeat[]>`
      SELECT p."chatAreaId", a.title, a."jobPostId", p."userId", u."userType",
             ja.status AS "applicationStatus"
        FROM chat_participants p
        JOIN chat_areas a ON a.id = p."chatAreaId"
        JOIN users u ON u.id = p."userId"
        LEFT JOIN job_applications ja
          ON ja."jobPostId" = a."jobPostId" AND ja."jobSeekerId" = p."userId"
       WHERE a.kind = 'JOB'
    `;
    const stale = seats.filter(isStaleSeat);

    for (const [areaId, areaSeats] of Map.groupBy(stale, (s) => s.chatAreaId)) {
      console.log(`  ${areaSeats[0]!.title} (${areaId}): ${areaSeats.length}`);
    }
    console.log(`${stale.length} stale seat(s) across ${seats.length} job chat seat(s).`);

    if (!apply) {
      console.log('Report only. Rerun with --apply to delete them.');
      return;
    }
    if (stale.length === 0) return;

    const { count } = await prisma.chatParticipant.deleteMany({
      where: { OR: stale.map(stillStale) },
    });
    console.log(`Deleted ${count} seat(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  main(process.argv.includes('--apply')).catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
