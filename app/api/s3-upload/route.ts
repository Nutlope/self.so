import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { POST as s3UploadRoute } from 'next-s3-upload/route';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/server/rateLimit';
import { readJsonBody } from '@/lib/server/readJsonBody';
import { createUserUploadKey } from '@/lib/server/s3';

const MAX_BODY_BYTES = 4 * 1024;

const UploadRequestSchema = z.object({
  filename: z
    .string()
    .max(255)
    .regex(/\.pdf$/i),
  filetype: z.enum(['application/pdf', 'application/x-pdf', '']),
  _nextS3: z.object({ strategy: z.literal('aws-sdk') }),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = await rateLimit('s3Upload', `user:${userId}`);
    if (!limitResult.success) return rateLimitResponse(limitResult);

    const body = await readJsonBody(request, MAX_BODY_BYTES);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }

    const parsed = UploadRequestSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 },
      );
    }

    const key = createUserUploadKey(userId);
    const handler = s3UploadRoute.configure({ key: () => key });

    return await handler(
      new NextRequest(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'resume.pdf',
          filetype: 'application/pdf',
          _nextS3: { strategy: parsed.data._nextS3.strategy },
        }),
      }),
    );
  } catch (error) {
    console.error('Error creating upload credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
