import { PrismaClient } from '@prisma/client';

// In Prisma 7, we pass the datasource URL directly into the constructor
const prisma = new PrismaClient({
  datasource: {
    url: process.env.DATABASE_URL
  }
});

export default prisma;