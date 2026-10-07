/** In-memory rate limiter and idempotency cache. Single-process only: use a shared store in a multi-instance deployment. */
import type { HandlerResponse } from './handler';

export function createRateLimiter(max = 5, windowMs = 10 * 60 * 1000) {
  const hits = new Map<string, number[]>();
  return {
    take(key: string, now: number): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
      return true;
    },
  };
}

export function createDedupe(ttlMs = 60 * 60 * 1000, now: () => number = Date.now) {
  const seen = new Map<string, { at: number; r: HandlerResponse }>();
  return {
    get(key: string) {
      const hit = seen.get(key);
      if (!hit) return undefined;
      if (now() - hit.at > ttlMs) {
        seen.delete(key);
        return undefined;
      }
      return hit.r;
    },
    set(key: string, r: HandlerResponse) {
      seen.set(key, { at: now(), r });
      if (seen.size > 5000) for (const [k, v] of seen) if (now() - v.at > ttlMs) seen.delete(k);
    },
  };
}
