import { pdfToText } from 'pdf-ts';
import { S3Client, GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';

// Types
type S3UrlParts = {
  bucket: string;
  key: string;
};

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.S3_UPLOAD_REGION!!,
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY!!,
    secretAccessKey: process.env.S3_UPLOAD_SECRET!!,
  },
});

/**
 * Extracts bucket and key from an S3 URL
 */
function parseS3Url(url: string): S3UrlParts {
  const parsedUrl = new URL(url);
  return {
    bucket: parsedUrl.hostname.split('.')[0],
    key: parsedUrl.pathname.substring(1), // Remove leading slash
  };
}

/**
 * Fetches a file from S3
 */
async function fetchFromS3(bucket: string, key: string): Promise<GetObjectCommandOutput> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('No body in S3 response');
  }
  
  return response;
}

/**
 * Extracts text content from a PDF file stored in S3
 */
export async function scrapePdfContent(pdfUrl: string): Promise<string> {
  console.log('Scraping PDF content from:', pdfUrl);
  
  try {
    // Parse S3 URL and fetch file
    const { bucket, key } = parseS3Url(pdfUrl);
    const response = await fetchFromS3(bucket, key);
    
    // Type guard to ensure Body exists
    if (!response.Body) {
      throw new Error('No body in S3 response');
    }
    
    // Convert to byte array and extract text
    const pdf = await response.Body.transformToByteArray();
    const text = await pdfToText(new Uint8Array(pdf));
    
    console.log('Successfully scraped PDF content');
    return text;
  } catch (error: any) {
    console.error('Error fetching from S3:', error);
    throw new Error(`Failed to fetch PDF from S3: ${error.message || 'Unknown error'}`);
  }
}