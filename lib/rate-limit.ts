import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error("[RATE-LIMIT] Failed to initialize Upstash Redis client:", err);
  }
}

type RateLimitBucket = {
  timestamps: number[];
};

const localCache = new Map<string, RateLimitBucket>();

/**
 * Sliding window rate limiting helper.
 * Supports Upstash Redis in serverless/production mode and falls back to in-memory sliding window cache.
 *
 * @param key unique identifier (e.g. IP address or user email)
 * @param limit maximum allowed requests in the time window
 * @param windowMs time window in milliseconds (default: 1 hour)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60 * 60 * 1000
): Promise<boolean> {
  const now = Date.now();

  // If Redis is configured, use it for distributed serverless rate limiting
  if (redisClient) {
    try {
      const redisKey = `ratelimit:${key}`;
      const windowStart = now - windowMs;

      // 1. Remove old timestamps outside the sliding window
      await redisClient.zremrangebyscore(redisKey, 0, windowStart);

      // 2. Count active request timestamps
      const count = await redisClient.zcard(redisKey);

      if (count >= limit) {
        return false; // Limit exceeded
      }

      // 3. Record current request timestamp
      const timestampMember = `${now}-${Math.random().toString(36).substring(2, 7)}`;
      await redisClient.zadd(redisKey, { score: now, member: timestampMember });
      
      // 4. Set expiration to clean up idle keys
      await redisClient.expire(redisKey, Math.ceil(windowMs / 1000));

      return true;
    } catch (error) {
      console.error("[RATE-LIMIT] Redis operation failed, falling back to memory:", error);
    }
  }

  // Fallback to local in-memory sliding window cache (for dev)
  const bucket = localCache.get(key) || { timestamps: [] };

  // Remove timestamps outside window
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= limit) {
    return false; // Limit exceeded
  }

  bucket.timestamps.push(now);
  localCache.set(key, bucket);

  return true;
}
