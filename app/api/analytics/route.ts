import { upstashRedis } from '@/lib/server/redis';
import { Resume } from '@/lib/server/redisActions';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

// API Response Types
export type GetResponse =
  | {
      totalResumes: number;
      publishedResumes: number;
    }
  | { error: string };

// Cached function to fetch analytics
const getCachedAnalytics = unstable_cache(
  async () => {
    let cursor = '0'; // Redis SCAN returns string cursor
    let publishedCount = 0;
    let totalCount = 0;

    // Use SCAN to iterate through all keys
    do {
      const [nextCursor, currentKeys] = await upstashRedis.scan(cursor, {
        match: 'resume:*',
        count: 100, // Process in batches of 100
      });

      cursor = nextCursor as string;

      if (currentKeys.length > 0) {
        totalCount += currentKeys.length;
        // Get all resumes in current batch
        const resumes = (await Promise.all(
          currentKeys.map((key) => upstashRedis.get(key))
        )) as (Resume | null)[];

        // Count published resumes in current batch
        publishedCount += resumes.filter(
          (resume): resume is Resume => resume?.status === 'live'
        ).length;
      }
    } while (cursor !== '0');

    return {
      totalResumes: totalCount,
      publishedResumes: publishedCount,
    };
  },
  ['analytics'],
  {
    tags: ['analytics'],
    revalidate: 60, // Cache for 1 minute
  }
);

// GET endpoint to fetch resume analytics
export async function GET(): Promise<NextResponse<GetResponse>> {
  try {
    const analytics = await getCachedAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching resume analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
