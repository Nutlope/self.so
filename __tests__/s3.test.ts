import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createUserUploadKey,
  getUploadObjectUrl,
  isUserUploadKey,
} from '@/lib/server/s3';

describe('S3 upload helpers', () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env.S3_UPLOAD_BUCKET = 'my-bucket';
    process.env.S3_UPLOAD_REGION = 'us-east-1';
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('creates per-user keys that validate only for that user', () => {
    const key = createUserUploadKey('user_123');
    expect(key).toMatch(/^resumes\/user_123\/[0-9a-f-]{36}\.pdf$/);
    expect(isUserUploadKey('user_123', key)).toBe(true);
    expect(isUserUploadKey('user_456', key)).toBe(false);
    expect(isUserUploadKey('user_123', 'resumes/user_123/../x.pdf')).toBe(false);
    expect(isUserUploadKey('user_123', 'next-s3-uploads/abc/x.pdf')).toBe(false);
  });

  it('builds URLs only for the configured bucket', () => {
    expect(getUploadObjectUrl('my-bucket', 'resumes/u/a b.pdf')).toBe(
      'https://my-bucket.s3.us-east-1.amazonaws.com/resumes/u/a%20b.pdf',
    );
    expect(getUploadObjectUrl('other-bucket', 'resumes/u/a.pdf')).toBeNull();
    expect(getUploadObjectUrl('my-bucket', '../a.pdf')).toBeNull();
    expect(getUploadObjectUrl('my-bucket', '/a.pdf')).toBeNull();
    expect(getUploadObjectUrl('my-bucket', '')).toBeNull();
  });

  it('keeps hosts pinned even with tricky keys', () => {
    const url = getUploadObjectUrl('my-bucket', 'a@evil.com/x#y?z.pdf');
    expect(new URL(url!).host).toBe('my-bucket.s3.us-east-1.amazonaws.com');
  });
});
