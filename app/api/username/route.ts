import { getUsernameById, updateUsername } from '@/lib/server/redisActions';
import { currentUser } from '@clerk/nextjs/server';
import { getClientIdentifier, rateLimit } from '@/lib/server/rateLimit';
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

    const ip = getClientIdentifier(request);
    const limitResult = await rateLimit(ip, 10, 60);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 },
      );
    }

    if (username.length > 50 || username.includes('/') || username.includes('\\')) {
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
