import { getResume, getUserIdByUsername } from '@/lib/server/redisActions';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

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
    clerkUser = await clerkClient.users.getUser(user_id);
  } catch (e: any) {
    if (e?.code === 'api_response_error' && e?.status === 404) {
      console.warn(`[getUserData] User ${user_id} not found in Clerk, may have been deleted`);
    } else {
      console.warn('[getUserData] Clerk API error:', e);
    }
  }

  return { user_id, resume, clerkUser };
}
