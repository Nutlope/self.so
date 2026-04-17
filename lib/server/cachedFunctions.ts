import { getResume } from '@/lib/server/redisActions';
import { unstable_cache } from 'next/cache';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const getCachedUser = async (userId: string) => {
  return unstable_cache(
    async () => {
      return await clerkClient.users.getUser(userId);
    },
    [userId],
    {
      tags: ['users'],
      revalidate: 86400,
    },
  )();
};

export const getCachedResume = async (userId: string) => {
  return unstable_cache(
    async () => {
      return await getResume(userId);
    },
    [userId],
    {
      tags: ['resumes'],
      revalidate: 86400, // 1 day in seconds
    },
  );
};
