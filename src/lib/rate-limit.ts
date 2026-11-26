import "server-only";
import { headers } from "next/headers";

/**
 * Simple fixed-window in-memory rate limiter.
 * NOTE: On serverless (Vercel) each instance has its own memory, so this is a
 * best-effort guard. Swap for a shared store (e.g. Upstash Redis) for strict limits.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(scope: string, limit: number, windowMs: number, id?: string) {
  const key = `${scope}:${id ?? (await clientIp())}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return { ok: true as const };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false as const, retryAfterMs: bucket.resetAt - now };
  return { ok: true as const };
}
