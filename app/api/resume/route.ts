import { getResume, Resume, storeResume } from '@/lib/server/redisActions';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

// API Response Types
export type GetResumeResponse = { resume?: Resume } | { error: string };
export type PostResumeResponse =
  | { success: true }
  | { error: string; details?: z.ZodError['issues'] };

// GET endpoint to retrieve resume
export async function GET(): Promise<NextResponse<GetResumeResponse>> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = await getResume(user.id);
    return NextResponse.json({ resume });
  } catch (error) {
    console.error('Error retrieving resume:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST endpoint to store resume
export async function POST(
  request: Request,
): Promise<NextResponse<PostResumeResponse>> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await storeResume(user.id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.issues },
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
