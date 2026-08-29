/**
 * In-memory rate limiter (sliding window).
 *
 * For production at scale, swap with Upstash Redis or Vercel KV.
 * For MVP use, in-memory is fine on a single-instance deployment.
 *
 * Usage:
 *   const ok = rateLimit({ key: `order:create:${ip}`, limit: 5, windowMs: 60_000 });
 *   if (!ok.ok) throw new Error("Too many requests");
 */

type RateLimitOptions = {
  /** Unique identifier for this throttling bucket — combine action + ip + userId */
  key: string;
  /** Max number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

// Global store (persists across requests in same Node.js process)
const store = new Map<string, Bucket>();

// Periodically clean up expired buckets (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [k, b] of store) {
        if (b.resetAt <= now) store.delete(k);
      }
    },
    5 * 60 * 1000
  ).unref?.();
}

/**
 * Check if a request is allowed under the rate limit.
 * Returns { ok: true } if allowed, { ok: false, retryAfterMs } if denied.
 */
export function rateLimit(opts: RateLimitOptions): {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  const existing = store.get(opts.key);

  if (!existing || existing.resetAt <= now) {
    // Fresh window
    store.set(opts.key, {
      count: 1,
      resetAt: now + opts.windowMs,
    });
    return { ok: true, remaining: opts.limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count++;
  return {
    ok: true,
    remaining: opts.limit - existing.count,
    retryAfterMs: 0,
  };
}

/**
 * Get client IP from a Next.js request, accounting for proxies.
 */
export function getClientIp(request?: Request): string {
  if (!request) return "unknown";
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Standard rate limit presets per Security-plan.md section 22.
 */
export const RATE_LIMITS = {
  // Public endpoints
  ORDER_CREATE: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 orders / 10 min / IP
  ORDER_TRACK: { limit: 30, windowMs: 60 * 1000 }, // 30 lookups / min / IP
  SEARCH: { limit: 60, windowMs: 60 * 1000 }, // 60 searches / min / IP

  // Authenticated endpoints
  REVIEW_CREATE: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 reviews / hour / user
  ADDRESS_SAVE: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 / hour / user
  VOUCHER_REDEEM: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 / hour / user (Phase 5)
  GROUP_CREATE: { limit: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3 / day / user (Phase 6)
  GROUP_JOIN: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 / hour / user (Phase 6)

  // Auth
  LOGIN_ATTEMPT: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 / 15 min / IP

  // Staff endpoints
  ORDER_STATUS_UPDATE: { limit: 100, windowMs: 60 * 1000 }, // 100 / min / staff
  INVENTORY_ADJUST: { limit: 60, windowMs: 60 * 1000 }, // 60 / min / staff
} as const;
