/**
 * In-process rate limiter (suitable for single-instance / mid-team scale).
 * For multi-instance deployments, swap the Map for a Redis-backed counter.
 */

interface Window {
  count:   number;
  resetAt: number;
}

function createLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, Window>();

  // Purge expired windows every 5 minutes to prevent memory creep
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, w] of store) {
      if (now > w.resetAt) store.delete(key);
    }
  }, 5 * 60_000);
  timer.unref?.(); // Don't block process exit

  return function check(ip: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const w   = store.get(ip);

    if (!w || now > w.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSec: 0 };
    }

    if (w.count >= maxRequests) {
      return { allowed: false, retryAfterSec: Math.ceil((w.resetAt - now) / 1000) };
    }

    w.count++;
    return { allowed: true, retryAfterSec: 0 };
  };
}

/** 5 attempts per IP per 15 minutes — for login/refresh */
export const loginLimiter = createLimiter(5, 15 * 60_000);

/** 200 requests per IP per minute — for general API */
export const apiLimiter = createLimiter(200, 60_000);

/** Build a 429 response */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    {
      status: 429,
      headers: {
        'Content-Type':  'application/json',
        'Retry-After':   String(retryAfterSec),
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfterSec),
      },
    },
  );
}
