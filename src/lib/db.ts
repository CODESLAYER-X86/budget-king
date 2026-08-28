import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// ALWAYS cache the client globally — even in production.
// This prevents Vercel serverless from creating new PrismaClients
// on every cold start, which exhausts the Supabase connection pool.
globalForPrisma.prisma = db;
