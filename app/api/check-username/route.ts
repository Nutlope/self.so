import { checkUsernameAvailability } from '@/lib/server/redisActions';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/server/rateLimit';
import { isValidUsername } from '@/lib/config';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// API Response Types
export type PostResponse = { available: boolean } | { error: string };

// POST endpoint to check username availability
export async function POST(
  request: Request,
): Promise<NextResponse<PostResponse>> {
  try {
    const { userId } = await auth();
    const identifier = userId
      ? `user:${userId}`
      : `ip:${getClientIp(request)}`;
    const limitResult = await rateLimit('checkUsername', identifier);
    if (!limitResult.success) return rateLimitResponse(limitResult);

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 },
      );
    }

    if (!isValidUsername(username)) {
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
