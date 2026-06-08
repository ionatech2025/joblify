import { PrismaClient } from '@prisma/client';

// Singleton Prisma client. Reused across Fluid Compute invocations to avoid
// pool exhaustion. Do NOT instantiate a new PrismaClient anywhere else.
declare global {
   
  var __prisma: PrismaClient | undefined;
}

export const db: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}
