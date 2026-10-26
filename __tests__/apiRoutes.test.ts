import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'user_abc' as string | null,
  stored: undefined as any,
  storeResume: vi.fn(),
  rateLimit: vi.fn(),
  configure: vi.fn(),
  handler: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  currentUser: async () => (mocks.userId ? { id: mocks.userId } : null),
  auth: async () => ({ userId: mocks.userId }),
}));

vi.mock('@/lib/server/redisActions', async () => {
  const { z } = await import('zod');
  return {
    FileSchema: z.object({
      name: z.string().max(255),
      url: z.string().max(2048).nullish(),
      size: z.number().nonnegative(),
      bucket: z.string().max(255),
      key: z.string().max(1024),
    }),
    getResume: async () => mocks.stored,
    storeResume: mocks.storeResume,
    deleteResume: vi.fn(),
  };
});

vi.mock('@/lib/server/rateLimit', () => ({
  rateLimit: mocks.rateLimit,
  rateLimitResponse: () => new Response('limited', { status: 429 }),
}));

vi.mock('next-s3-upload/route', () => ({
  POST: { configure: mocks.configure },
}));

import { POST as postResume } from '@/app/api/resume/route';
import { POST as postUpload } from '@/app/api/s3-upload/route';
import { NextRequest } from 'next/server';

const jsonRequest = (body: unknown) =>
  new NextRequest('https://self.so/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const resumeData = {
  header: { name: 'A', shortAbout: 'B', contacts: {}, skills: [] },
  summary: 'S',
  workExperience: [],
  education: [],
};

describe('POST /api/resume', () => {
  beforeEach(() => {
    process.env.S3_UPLOAD_BUCKET = 'my-bucket';
    process.env.S3_UPLOAD_REGION = 'us-east-1';
    mocks.userId = 'user_abc';
    mocks.stored = {
      status: 'draft',
      file: { name: 'cv.pdf', url: 'u', size: 1, bucket: 'my-bucket', key: 'next-s3-uploads/old/cv.pdf' },
      fileContent: 'server text',
      resumeData,
    };
    mocks.storeResume.mockReset();
    mocks.rateLimit.mockReset().mockResolvedValue({ success: true });
  });

  it('ignores client fileContent and cannot clear resumeData', async () => {
    const res = await postResume(
      jsonRequest({ ...mocks.stored, fileContent: 'attacker text', resumeData: null, status: 'live' }),
    );
    expect(res.status).toBe(200);
    expect(mocks.storeResume).toHaveBeenCalledWith('user_abc', {
      status: 'live',
      file: mocks.stored.file,
      fileContent: 'server text',
      resumeData,
    });
  });

  it('accepts a new upload under the user prefix and resets derived data', async () => {
    const key = 'resumes/user_abc/123e4567-e89b-12d3-a456-426614174000.pdf';
    const res = await postResume(
      jsonRequest({
        file: { name: 'new.pdf', url: 'https://evil.example/x.pdf', size: 10, bucket: 'my-bucket', key },
        status: 'draft',
      }),
    );
    expect(res.status).toBe(200);
    expect(mocks.storeResume).toHaveBeenCalledWith('user_abc', {
      status: 'draft',
      file: {
        name: 'new.pdf',
        url: `https://my-bucket.s3.us-east-1.amazonaws.com/${key}`,
        size: 10,
        bucket: 'my-bucket',
        key,
      },
      fileContent: null,
      resumeData: null,
    });
  });

  it('rejects files outside the user prefix or bucket', async () => {
    for (const file of [
      { bucket: 'my-bucket', key: 'resumes/user_other/123e4567-e89b-12d3-a456-426614174000.pdf' },
      { bucket: 'evil-bucket', key: 'resumes/user_abc/123e4567-e89b-12d3-a456-426614174000.pdf' },
    ]) {
      const res = await postResume(jsonRequest({ file: { name: 'x.pdf', size: 1, ...file } }));
      expect(res.status).toBe(400);
    }
    expect(mocks.storeResume).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    mocks.userId = null;
    const res = await postResume(jsonRequest({ status: 'live' }));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/s3-upload', () => {
  beforeEach(() => {
    mocks.userId = 'user_abc';
    mocks.rateLimit.mockReset().mockResolvedValue({ success: true });
    mocks.handler.mockReset().mockResolvedValue(Response.json({ ok: true }));
    mocks.configure.mockReset().mockReturnValue(mocks.handler);
  });

  it('requires authentication', async () => {
    mocks.userId = null;
    const res = await postUpload(jsonRequest({}));
    expect(res.status).toBe(401);
    expect(mocks.configure).not.toHaveBeenCalled();
  });

  it('rejects non-PDF uploads', async () => {
    const res = await postUpload(
      jsonRequest({ filename: 'x.html', filetype: 'text/html', _nextS3: { strategy: 'aws-sdk' } }),
    );
    expect(res.status).toBe(400);
  });

  it('forwards a sanitized request with a server-chosen per-user key', async () => {
    const res = await postUpload(
      jsonRequest({ filename: '../../cv.pdf', filetype: 'application/pdf', _nextS3: { strategy: 'aws-sdk' } }),
    );
    expect(res.status).toBe(200);
    const { key } = mocks.configure.mock.calls[0][0];
    expect(key()).toMatch(/^resumes\/user_abc\/[0-9a-f-]{36}\.pdf$/);
    const forwarded = await mocks.handler.mock.calls[0][0].json();
    expect(forwarded).toEqual({
      filename: 'resume.pdf',
      filetype: 'application/pdf',
      _nextS3: { strategy: 'aws-sdk' },
    });
  });

  it('is rate limited per user', async () => {
    mocks.rateLimit.mockResolvedValue({ success: false, reason: 'limited' });
    const res = await postUpload(
      jsonRequest({ filename: 'cv.pdf', filetype: 'application/pdf', _nextS3: { strategy: 'aws-sdk' } }),
    );
    expect(res.status).toBe(429);
    expect(mocks.rateLimit).toHaveBeenCalledWith('s3Upload', 'user:user_abc');
  });
});
