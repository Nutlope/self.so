import { getUsernameById, updateUsername } from '@/lib/server/redisActions';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit, rateLimitResponse } from '@/lib/server/rateLimit';
import { readJsonBody } from '@/lib/server/readJsonBody';
import { isValidUsername } from '@/lib/config';
import { NextResponse } from 'next/server';

// API Response Types
export type GetResponse = { username?: string | null } | { error: string };
export type PostResponse = { success: true } | { error: string };

// GET endpoint to retrieve username
export async function GET(): Promise<NextResponse<GetResponse>> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = await getUsernameById(user.id);
    return NextResponse.json({ username });
  } catch (error) {
    console.error('Error retrieving username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST endpoint to update username
export async function POST(
  request: Request,
): Promise<NextResponse<PostResponse>> {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = await rateLimit('usernameWrite', `user:${user.id}`);
    if (!limitResult.success) return rateLimitResponse(limitResult);

    const body = await readJsonBody(request, 1024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }

    const username = (body.data as { username?: unknown } | null)?.username;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 },
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 },
      );
    }

    const success = await updateUsername(user.id, username);

    if (!success) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
