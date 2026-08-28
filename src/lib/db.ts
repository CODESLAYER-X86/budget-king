import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use the DIRECT connection (port 5432) for runtime queries.
// This is faster than the pooler (port 6543) for Vercel serverless
// because it avoids PgBouncer overhead and has a larger connection pool.
function createPrismaClient() {
  // Prefer DIRECT_URL (port 5432) if available, fall back to DATABASE_URL
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
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
