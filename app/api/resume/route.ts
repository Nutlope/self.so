import {
  deleteResume,
  FileSchema,
  getResume,
  Resume,
  storeResume,
} from '@/lib/server/redisActions';
import { ResumeDataSchema } from '@/lib/resume';
import { rateLimit, rateLimitResponse } from '@/lib/server/rateLimit';
import { readJsonBody } from '@/lib/server/readJsonBody';
import { getUploadObjectUrl, isUserUploadKey, MAX_PDF_SIZE } from '@/lib/server/s3';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

const MAX_BODY_BYTES = 1024 * 1024;

const ResumeUpdateSchema = z.object({
  status: z.enum(['live', 'draft']).optional(),
  file: FileSchema.extend({ size: z.number().nonnegative().max(MAX_PDF_SIZE) })
    .nullish(),
  resumeData: ResumeDataSchema.nullish(),
});

// API Response Types
export type GetResumeResponse = { resume?: Resume } | { error: string };
export type PostResumeResponse = { success: true } | { error: string };

// GET endpoint to retrieve resume
export async function GET(): Promise<NextResponse<GetResumeResponse>> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = await getResume(user.id);
    if (!resume) return NextResponse.json({});

    const { fileContent: _fileContent, ...publicResume } = resume;
    return NextResponse.json({ resume: publicResume });
  } catch (error) {
    console.error('Error retrieving resume:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST endpoint to store resume. `fileContent` is only ever written by the
// server; a new upload resets it and `resumeData` so the PDF is re-processed.
export async function POST(
  request: Request,
): Promise<NextResponse<PostResumeResponse>> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = await rateLimit('resumeWrite', `user:${user.id}`);
    if (!limitResult.success) return rateLimitResponse(limitResult);

    const body = await readJsonBody(request, MAX_BODY_BYTES);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }

    const parsed = ResumeUpdateSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 },
      );
    }
    const update = parsed.data;

    const existing = await getResume(user.id);
    const isNewFile = !!update.file && update.file.key !== existing?.file?.key;

    let file = existing?.file;
    if (isNewFile && update.file) {
      const url = isUserUploadKey(user.id, update.file.key)
        ? getUploadObjectUrl(update.file.bucket, update.file.key)
        : null;
      if (!url) {
        return NextResponse.json(
          { error: 'Invalid data format' },
          { status: 400 },
        );
      }
      file = { ...update.file, url };
    }

    await storeResume(user.id, {
      status: update.status ?? existing?.status ?? 'draft',
      file,
      fileContent: isNewFile ? null : existing?.fileContent,
      resumeData: isNewFile
        ? null
        : (update.resumeData ?? existing?.resumeData),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 },
      );
    }
    console.error('Error storing resume:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = await rateLimit('resumeWrite', `user:${user.id}`);
    if (!limitResult.success) return rateLimitResponse(limitResult);

    const success = await deleteResume(user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete resume' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
