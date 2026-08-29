import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use DATABASE_URL (pooler, port 6543) with PgBouncer
// connection_limit=1 to prevent pool exhaustion on Supabase free tier
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

// ALWAYS cache globally — prevents creating new clients on every cold start
globalForPrisma.prisma = db;
