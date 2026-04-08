import { upstashRedis } from '@/lib/server/redis';
import { ResumeDataSchema } from '@/lib/resume';
import { z } from 'zod';
import { PRIVATE_ROUTES } from '../routes';

// Key prefixes for different types of data
const REDIS_KEYS = {
  RESUME_PREFIX: 'resume:', // Using colon is a Redis convention for namespacing
  USER_ID_PREFIX: 'user:id:',
  USER_NAME_PREFIX: 'user:name:',
} as const;

// Define the file schema
const FileSchema = z.object({
  name: z.string(),
  url: z.string().nullish(),
  size: z.number(),
  bucket: z.string(),
  key: z.string(),
});

const FORBIDDEN_USERNAMES = PRIVATE_ROUTES;

// Define the complete resume schema
const ResumeSchema = z.object({
  status: z.enum(['live', 'draft']).default('draft'),
  file: FileSchema.nullish(),
  fileContent: z.string().nullish(),
  resumeData: ResumeDataSchema.nullish(),
});

// Type inference for the resume data
export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type Resume = z.infer<typeof ResumeSchema>;

// Function to get resume data for a user
export async function getResume(userId: string): Promise<Resume | undefined> {
  try {
    const resume = await upstashRedis.get<Resume>(
      `${REDIS_KEYS.RESUME_PREFIX}${userId}`,
    );
    return resume || undefined;
  } catch (error) {
    console.error('Error retrieving resume:', error);
    throw new Error('Failed to retrieve resume');
  }
}

// Function to store resume data for a user
export async function deleteResume(userId: string): Promise<boolean> {
  try {
    // Skip S3 deletion for now due to IAM permissions issue
    // const resume = await getResume(userId);
    
    // if (resume?.file?.bucket && resume?.file?.key) {
    //   await deleteS3File({
    //     bucket: resume.file.bucket,
    //     key: resume.file.key,
    //   });
    // }
    
    await upstashRedis.del(`${REDIS_KEYS.RESUME_PREFIX}${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting resume:', error);
    return false;
  }
}

export async function storeResume(
  userId: string,
  resumeData: Resume,
): Promise<void> {
  try {
    const validatedData = ResumeSchema.parse(resumeData);
    await upstashRedis.set(
      `${REDIS_KEYS.RESUME_PREFIX}${userId}`,
      validatedData,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    console.error('Error storing resume:', error);
    throw new Error('Failed to store resume');
  }
}

/**
 * Create a new user with bidirectional lookup
 * @param userId Unique user identifier
 * @param username Unique username
 * @returns Promise resolving to boolean indicating success
 */
export const createUsernameLookup = async ({
  userId,
  username,
}: {
  userId: string;
  username: string;
}): Promise<boolean> => {
  // Check if username is forbidden
  if (FORBIDDEN_USERNAMES.includes(username.toLowerCase())) {
    return false;
  }

  // Check if username or user_id already exists
  const [usernameExists, userIdExists] = await Promise.all([
    upstashRedis.exists(`${REDIS_KEYS.USER_NAME_PREFIX}${username}`),
    upstashRedis.exists(`${REDIS_KEYS.USER_ID_PREFIX}${userId}`),
  ]);

  if (usernameExists || userIdExists) {
    return false;
  }

  // Create mappings in both directions
  const transaction = upstashRedis.multi();
  transaction.set(`${REDIS_KEYS.USER_ID_PREFIX}${userId}`, username);
  transaction.set(`${REDIS_KEYS.USER_NAME_PREFIX}${username}`, userId);

  try {
    const results = await transaction.exec();
    return results.every((result) => result === 'OK');
  } catch (error) {
    console.error('User creation failed:', error);
    return false;
  }
};

/**
 * Retrieve username by user ID
 * @param userId User ID to look up
 * @returns Promise resolving to username or null
 */
export const getUsernameById = async (
  userId: string,
): Promise<string | null> => {
  return await upstashRedis.get(`${REDIS_KEYS.USER_ID_PREFIX}${userId}`);
};

/**
 * Retrieve user ID by username
 * @param username Username to look up
 * @returns Promise resolving to user ID or null
 */
export const getUserIdByUsername = async (
  username: string,
): Promise<string | null> => {
  return await upstashRedis.get(`${REDIS_KEYS.USER_NAME_PREFIX}${username}`);
};

export const checkUsernameAvailability = async (
  username: string,
): Promise<{
  available: boolean;
}> => {
  if (FORBIDDEN_USERNAMES.includes(username.toLowerCase())) {
    return { available: false };
  }
  const userId = await getUserIdByUsername(username);
  return { available: !userId };
};

/**
 * Delete a user by either user ID or username
 * @param opts Object containing either userId or username
 * @returns Promise resolving to boolean indicating success
 */
export const deleteUser = async (opts: {
  userId?: string;
  username?: string;
}): Promise<boolean> => {
  let userId: string | null = null;
  let username: string | null = null;

  // Determine lookup method based on input
  if (opts.userId) {
    username = await getUsernameById(opts.userId);
    if (!username) return false;
  } else if (opts.username) {
    userId = await getUserIdByUsername(opts.username);
    if (!userId) return false;
  } else {
    return false;
  }

  // Use the found values if not provided
  userId = userId || opts.userId!;
  username = username || opts.username!;

  // Delete both mappings
  const transaction = upstashRedis.multi();
  transaction.del(`${REDIS_KEYS.USER_ID_PREFIX}${userId}`);
  transaction.del(`${REDIS_KEYS.USER_NAME_PREFIX}${username}`);

  try {
    const results = await transaction.exec();
    return results.every((result) => result === 1);
  } catch (error) {
    console.error('User deletion failed:', error);
    return false;
  }
};

/**
 * Update username for a given user ID
 * @param userId User ID to update
 * @param newUsername New username
 * @returns Promise resolving to boolean indicating success
 */
export const updateUsername = async (
  userId: string,
  newUsername: string,
): Promise<boolean> => {
  // Check if new username is forbidden
  if (FORBIDDEN_USERNAMES.includes(newUsername.toLowerCase())) {
    return false;
  }

  // Get current username
  const currentUsername = await getUsernameById(userId);
  if (!currentUsername) return false;

  // Check if new username is already taken
  const newUsernameExists = await upstashRedis.exists(
    `${REDIS_KEYS.USER_NAME_PREFIX}${newUsername}`,
  );
  if (newUsernameExists) return false;

  // Create transaction to update mappings
  const transaction = upstashRedis.multi();
  transaction.del(`${REDIS_KEYS.USER_NAME_PREFIX}${currentUsername}`);
  transaction.set(`${REDIS_KEYS.USER_ID_PREFIX}${userId}`, newUsername);
  transaction.set(`${REDIS_KEYS.USER_NAME_PREFIX}${newUsername}`, userId);

  try {
    const results = await transaction.exec();
    return results.every((result) => result === 'OK' || result === 1);
  } catch (error) {
    console.error('Username update failed:', error);
    return false;
  }
};
