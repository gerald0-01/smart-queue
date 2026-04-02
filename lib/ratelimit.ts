import NodeCache from "node-cache";

const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 60 });

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export const rateLimit = {
  auth: (key: string): RateLimitResult => {
    return limit(key, "auth", 5);
  },
  general: (key: string): RateLimitResult => {
    return limit(key, "general", 30);
  },
  strict: (key: string): RateLimitResult => {
    return limit(key, "strict", 10);
  },
};

function limit(key: string, prefix: string, limit: number): RateLimitResult {
  const cacheKey = `${prefix}:${key}`;
  const current = (rateLimitCache.get<number>(cacheKey) || 0) + 1;
  rateLimitCache.set(cacheKey, current, 60);

  const remaining = Math.max(0, limit - current);
  const reset = Math.floor(Date.now() / 1000) + 60;

  return {
    success: current <= limit,
    remaining,
    reset,
  };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}