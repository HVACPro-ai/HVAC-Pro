import { LRUCache } from "lru-cache";

const defaultMax = Number(process.env.RATE_LIMIT_MAX ?? 60);
const defaultWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);

type CacheKey = string;

const cache = new LRUCache<CacheKey, { count: number; expiresAt: number }>({
  max: 10_000,
});

function getIp(request: Request): string {
  const forwarded = (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  return forwarded || realIp || "127.0.0.1";
}

export async function rateLimit(request: Request, opts?: { key?: string; limit?: number; windowMs?: number }) {
  const ip = getIp(request);
  const limit = opts?.limit ?? defaultMax;
  const windowMs = opts?.windowMs ?? defaultWindowMs;
  const now = Date.now();
  const cacheKey = `${opts?.key ?? "global"}:${ip}`;

  const entry = cache.get(cacheKey);
  if (!entry || entry.expiresAt < now) {
    cache.set(cacheKey, { count: 1, expiresAt: now + windowMs }, { ttl: windowMs });
    return { success: true, remaining: limit - 1 } as const;
  }

  if (entry.count >= limit) {
    const retryAfterMs = entry.expiresAt - now;
    return { success: false, retryAfterMs } as const;
  }

  entry.count += 1;
  cache.set(cacheKey, entry, { ttl: entry.expiresAt - now });
  return { success: true, remaining: limit - entry.count } as const;
}
