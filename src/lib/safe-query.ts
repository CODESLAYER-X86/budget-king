/**
 * Database query wrapper for Vercel Hobby + Supabase Free tier.
 * 
 * Prevents "EMAXCONNSESSION" crashes by catching connection errors
 * and returning a default value instead of crashing the page.
 * 
 * Usage:
 *   const products = await safeQuery(
 *     () => db.product.findMany({ where: { status: "ACTIVE" } }),
 *     []  // default value if DB fails
 *   );
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    const msg = (error as Error).message;
    if (
      msg.includes("EMAXCONNSESSION") ||
      msg.includes("FATAL") ||
      msg.includes("connection") ||
      msg.includes("timeout") ||
      msg.includes("Timed out")
    ) {
      console.error("DB connection error (returning default):", msg.slice(0, 100));
      return defaultValue;
    }
    // For other errors (not connection-related), re-throw
    throw error;
  }
}

/**
 * Wrapper for multiple parallel queries.
 * Each query is independently protected.
 * 
 * Usage:
 *   const [products, categories] = await safeQueries([
 *     [() => db.product.findMany(...), []],
 *     [() => db.category.findMany(...), []],
 *   ]);
 */
export async function safeQueries<T extends any[]>(
  queries: { [K in keyof T]: [() => Promise<T[K]>, T[K]] }
): Promise<T> {
  return Promise.all(
    queries.map(([fn, def]) => safeQuery(fn, def))
  ) as Promise<T>;
}
