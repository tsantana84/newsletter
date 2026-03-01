import { NextRequest } from "next/server";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor({ windowMs, maxRequests }: RateLimitOptions) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Subscribe: 5 requests per minute
export const subscribeLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
});

// Confirm/Unsubscribe: 10 requests per minute
export const tokenLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});

// Send: 10 requests per hour
export const sendLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
});
