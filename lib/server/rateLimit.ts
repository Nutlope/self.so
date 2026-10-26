import { NextResponse } from 'next/server';
import { upstashRedis } from './redis';

type RateLimitRule = { limit: number; windowSeconds: number };

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

export const RATE_LIMITS = {
  generateResume: [
    { limit: 5, windowSeconds: HOUR },
    { limit: 10, windowSeconds: DAY },
  ],
  scrapePdf: [
    { limit: 10, windowSeconds: HOUR },
    { limit: 20, windowSeconds: DAY },
  ],
  s3Upload: [
    { limit: 10, windowSeconds: HOUR },
    { limit: 30, windowSeconds: DAY },
  ],
  resumeWrite: [{ limit: 60, windowSeconds: 60 }],
  usernameWrite: [{ limit: 10, windowSeconds: 60 }],
  checkUsername: [{ limit: 30, windowSeconds: 60 }],
} satisfies Record<string, RateLimitRule[]>;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

export type RateLimitResult =
  | { success: true }
  | { success: false; reason: 'limited' | 'unavailable' };

// Fixed-window counters in Upstash Redis. Fails closed: if Redis errors, the
// request is rejected.
export async function rateLimit(
  bucket: RateLimitBucket,
  identifier: string,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  try {
    for (const rule of RATE_LIMITS[bucket] as RateLimitRule[]) {
      const window = Math.floor(now / 1000 / rule.windowSeconds);
      const key = `rate-limit:${bucket}:${rule.windowSeconds}:${window}:${identifier}`;
      const [count] = await upstashRedis
        .multi()
        .incr(key)
        .expire(key, rule.windowSeconds)
        .exec<[number, number]>();

      if (typeof count !== 'number' || count > rule.limit) {
        return {
          success: false,
          reason: typeof count === 'number' ? 'limited' : 'unavailable',
        };
      }
    }
    return { success: true };
  } catch (error) {
    console.error(`Rate limiter unavailable for ${bucket}:`, error);
    return { success: false, reason: 'unavailable' };
  }
}

export function rateLimitResponse(
  result: Extract<RateLimitResult, { success: false }>,
) {
  if (result.reason === 'limited') {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }
  return NextResponse.json(
    { error: 'Service temporarily unavailable. Please try again later.' },
    { status: 503 },
  );
}

// Vercel's edge overwrites `x-real-ip` and `x-vercel-forwarded-for`, so they
// cannot be spoofed by the client. `x-forwarded-for` is only trusted outside
// Vercel (local dev).
export function getClientIp(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): string {
  const vercelIp =
    request.headers.get('x-real-ip')?.trim() ||
    firstListValue(request.headers.get('x-vercel-forwarded-for'));
  if (vercelIp) return vercelIp.slice(0, 64);

  if (env.VERCEL !== '1') {
    const forwarded = firstListValue(request.headers.get('x-forwarded-for'));
    return (forwarded || 'local').slice(0, 64);
  }

  return 'unknown';
}

function firstListValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null;
}
