import { randomUUID } from 'crypto';

export const MAX_PDF_SIZE = 15 * 1024 * 1024;

const MAX_KEY_LENGTH = 1024;

export function getUploadBucketConfig() {
  const bucket = process.env.S3_UPLOAD_BUCKET;
  const region = process.env.S3_UPLOAD_REGION;
  if (!bucket || !region) {
    throw new Error('S3 upload bucket is not configured');
  }
  return { bucket, region };
}

const userUploadPrefix = (userId: string) => `resumes/${userId}/`;

export function createUserUploadKey(userId: string) {
  return `${userUploadPrefix(userId)}${randomUUID()}.pdf`;
}

export function isUserUploadKey(userId: string, key: string) {
  const prefix = userUploadPrefix(userId);
  return (
    key.startsWith(prefix) &&
    /^[0-9a-f-]{36}\.pdf$/.test(key.slice(prefix.length))
  );
}

// Builds the object URL for a file in the configured upload bucket. Returns
// null for any other bucket or a malformed key.
export function getUploadObjectUrl(bucket: string, key: string) {
  const config = getUploadBucketConfig();
  if (
    bucket !== config.bucket ||
    !key ||
    key.length > MAX_KEY_LENGTH ||
    key.startsWith('/') ||
    key.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    return null;
  }

  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${encodedKey}`;
}
