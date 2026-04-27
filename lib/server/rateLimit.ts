import { upstashRedis } from './redis';

export async function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowSeconds: number = 60,
): Promise<{ success: boolean; limit: number; remaining: number }> {
  const key = `rate-limit:${identifier}`;
  let count = await upstashRedis.incr(key);

  if (count === 1) {
    await upstashRedis.expire(key, windowSeconds);
  }

  const remaining = Math.max(maxRequests - count, 0);
  return { success: count <= maxRequests, limit: maxRequests, remaining };
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0].trim() || realIp || 'unknown';
  return ip;
}
