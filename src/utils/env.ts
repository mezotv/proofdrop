export function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function bucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME ?? process.env.S3_BUCKET_NAME ?? process.env.AWS_BUCKET_NAME;

  if (!bucket) {
    throw new Error("Missing required environment variable: AWS_S3_BUCKET_NAME");
  }

  return bucket;
}
