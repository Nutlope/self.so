import { getResume, getUserIdByUsername } from '@/lib/server/redisActions';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T | undefined> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (i === retries - 1) throw e;
      const isNetworkError =
        e?.code === 'api_response_error' ||
        e?.message?.includes('fetch failed') ||
        e?.cause?.message?.includes('fetch failed');
      if (isNetworkError) {
        console.warn(`[fetchWithRetry] Attempt ${i + 1} failed, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      } else {
        throw e;
      }
    }
  }
}

export async function getUserData(username: string) {
  const user_id = await getUserIdByUsername(username);
  if (!user_id)
    return { user_id: undefined, resume: undefined, clerkUser: undefined };

  const resume = await getResume(user_id);
  if (!resume?.resumeData || resume.status !== 'live') {
    return { user_id, resume: undefined, clerkUser: undefined };
  }

  let clerkUser;
  try {
    clerkUser = await fetchWithRetry(() => clerkClient.users.getUser(user_id));
  } catch (e: any) {
    if (e?.code === 'api_response_error' && e?.status === 404) {
      console.warn(`[getUserData] User ${user_id} not found in Clerk, may have been deleted`);
    } else {
      console.warn('[getUserData] Clerk API error:', e);
    }
  }

  return { user_id, resume, clerkUser };
}
