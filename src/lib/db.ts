import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use DATABASE_URL (pooler, port 6543) for runtime queries.
// The pooler handles connection scaling for Vercel serverless.
function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  return new PrismaClient({
    log: ["error"],
    datasources: {
      db: { url },
    },
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// ALWAYS cache globally — even in production on Vercel serverless
globalForPrisma.prisma = db;
