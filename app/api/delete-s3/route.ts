import { deleteS3File } from '@/lib/server/deleteS3File';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bucket, key } = body;

    if (!bucket || !key) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    await deleteS3File({ bucket, key });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting S3 file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 