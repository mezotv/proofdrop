export function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function requiredAnyEnv(...names: string[]): string {
  const value = optionalEnv(...names);

  if (!value) {
    throw new Error(`Missing required environment variable: ${names.join(" or ")}`);
  }

  return value;
}

export function optionalEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  return undefined;
}

export function bucketName(): string {
  const bucket = optionalEnv("FILES_BUCKET", "FILES_S3_BUCKET", "AWS_S3_BUCKET_NAME", "S3_BUCKET_NAME", "AWS_BUCKET_NAME");

  if (!bucket) {
    throw new Error("Missing required environment variable: FILES_BUCKET");
  }

  return bucket;
}
