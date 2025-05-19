import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.S3_UPLOAD_REGION!!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!!,
  },
});

export const deleteS3File = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  console.log(`Deleting file ${key} from S3.`);

  await s3Client.send(command);

  console.log(`File ${key} deleted from S3.`);

  return { success: true };
};
