import { checkUsernameAvailability } from '@/lib/server/redisActions';
import { getClientIdentifier, rateLimit } from '@/lib/server/rateLimit';
import { NextResponse } from 'next/server';

// API Response Types
export type PostResponse = { available: boolean } | { error: string };

// POST endpoint to check username availability
export async function POST(
  request: Request,
): Promise<NextResponse<PostResponse>> {
  try {
    const ip = getClientIdentifier(request);
    const limitResult = await rateLimit(ip, 30, 60);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 },
      );
    }

    // Reject obvious path-traversal / injection patterns
    if (username.length > 50 || username.includes('/') || username.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 },
      );
    }

    const { available } = await checkUsernameAvailability(username);

    return NextResponse.json({ available });
  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
