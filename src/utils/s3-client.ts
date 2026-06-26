import { S3Client } from "@aws-sdk/client-s3";
import { requiredEnv } from "./env.js";

export function s3Client(): S3Client {
  return new S3Client({
    endpoint: requiredEnv("AWS_ENDPOINT_URL_S3"),
    region: process.env.AWS_REGION || "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
}
