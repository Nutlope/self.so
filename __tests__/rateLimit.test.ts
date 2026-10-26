import { beforeEach, describe, expect, it, vi } from 'vitest';

const { counts, execMock } = vi.hoisted(() => ({
  counts: new Map<string, number>(),
  execMock: vi.fn(),
}));

vi.mock('@/lib/server/redis', () => ({
  upstashRedis: {
    multi: () => {
      let key = '';
      const tx = {
        incr: (k: string) => {
          key = k;
          return tx;
        },
        expire: () => tx,
        exec: () => execMock(key),
      };
      return tx;
    },
  },
}));

import { getClientIp, rateLimit, RATE_LIMITS } from '@/lib/server/rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    counts.clear();
    execMock.mockReset();
    execMock.mockImplementation(async (key: string) => {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return [count, 1];
    });
  });

  it('allows requests up to the hourly generation limit, then blocks', async () => {
    const hourly = RATE_LIMITS.generateResume[0].limit;
    const now = Date.UTC(2026, 0, 1, 12);
    for (let i = 0; i < hourly; i++) {
      expect(await rateLimit('generateResume', 'user:a', now)).toEqual({
        success: true,
      });
    }
    expect(await rateLimit('generateResume', 'user:a', now)).toEqual({
      success: false,
      reason: 'limited',
    });
    expect(await rateLimit('generateResume', 'user:b', now)).toEqual({
      success: true,
    });
  });

  it('enforces the daily generation cap across hours', async () => {
    const daily = RATE_LIMITS.generateResume[1].limit;
    const start = Date.UTC(2026, 0, 1, 1);
    let allowed = 0;
    for (let hour = 0; hour < 20; hour++) {
      for (let i = 0; i < 10; i++) {
        const result = await rateLimit(
          'generateResume',
          'user:a',
          start + hour * 3600_000,
        );
        if (result.success) allowed++;
      }
    }
    expect(allowed).toBe(daily);
  });

  it('fails closed when Redis errors', async () => {
    execMock.mockRejectedValue(new Error('redis down'));
    expect(await rateLimit('generateResume', 'user:a')).toEqual({
      success: false,
      reason: 'unavailable',
    });
  });
});

describe('getClientIp', () => {
  const req = (headers: Record<string, string>) =>
    new Request('https://example.com', { headers });

  it('prefers x-real-ip and ignores x-forwarded-for on Vercel', () => {
    expect(
      getClientIp(
        req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' }),
        { VERCEL: '1' },
      ),
    ).toBe('1.1.1.1');
    expect(
      getClientIp(req({ 'x-forwarded-for': '9.9.9.9' }), { VERCEL: '1' }),
    ).toBe('unknown');
  });

  it('falls back to x-vercel-forwarded-for', () => {
    expect(
      getClientIp(req({ 'x-vercel-forwarded-for': '2.2.2.2, 3.3.3.3' }), {
        VERCEL: '1',
      }),
    ).toBe('2.2.2.2');
  });

  it('uses x-forwarded-for only outside Vercel', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8' }), {})).toBe(
      '9.9.9.9',
    );
  });
});
