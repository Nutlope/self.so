import AWS from 'aws-sdk';

AWS.config.update({
  region: process.env.S3_UPLOAD_REGION!!,
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY!!,
    secretAccessKey: process.env.S3_UPLOAD_SECRET!!,
  },
});

export const deleteS3File = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  const s3 = new AWS.S3();
  const bucketName = process.env.S3_UPLOAD_BUCKET;

  const params = { Bucket: bucket, Key: key };

  console.log(`Deleting file ${key} from S3.`);

  await s3.deleteObject(params).promise();

  console.log(`File ${key} deleted from S3.`);

  return { success: true };
};
