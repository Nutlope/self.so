import AWS from 'aws-sdk';

// Configure AWS with credentials from environment variables
AWS.config.update({
  region: process.env.S3_UPLOAD_REGION,
  accessKeyId: process.env.S3_UPLOAD_KEY,
  secretAccessKey: process.env.S3_UPLOAD_SECRET,
});

export const deleteS3File = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  const s3 = new AWS.S3();

  const params = { Bucket: bucket, Key: key };

  console.log(`Deleting file ${key} from S3.`);

  try {
    await s3.deleteObject(params).promise();
    console.log(`File ${key} deleted from S3.`);
    return { success: true };
  } catch (error) {
    console.error('Error in deleteS3File:', error);
    throw error;
  }
};
