import { readFile, stat } from "node:fs/promises";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MAX_ASSET_BYTES } from "../constants/asset.js";
import type { DeletedAsset, DeleteAssetInput, UploadedAsset, UploadAssetInput } from "../types/asset.js";
import { assetKey } from "../utils/asset-key.js";
import { bucketName } from "../utils/env.js";
import { inferContentType } from "../utils/content-type.js";
import { s3Client } from "../utils/s3-client.js";
import { clampTtl } from "../utils/ttl.js";

export async function uploadAsset(input: UploadAssetInput): Promise<UploadedAsset> {
  const fileStat = await stat(input.file_path);

  if (!fileStat.isFile()) {
    throw new Error(`Not a regular file: ${input.file_path}`);
  }

  if (fileStat.size > MAX_ASSET_BYTES) {
    throw new Error(`File is ${fileStat.size} bytes, which exceeds MAX_ASSET_BYTES=${MAX_ASSET_BYTES}`);
  }

  const bucket = bucketName();
  const key = assetKey(input.file_path, input.key_prefix);
  const contentType = input.content_type ?? inferContentType(input.file_path);
  const body = await readFile(input.file_path);
  const client = s3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentLength: fileStat.size,
      ContentType: contentType,
    }),
  );

  const ttl = clampTtl(input.expires_in_seconds);
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: ttl,
  });

  return {
    bucket,
    key,
    url,
    expiresAt,
    contentType,
    sizeBytes: fileStat.size,
  };
}

export async function deleteAsset(input: DeleteAssetInput): Promise<DeletedAsset> {
  const bucket = bucketName();
  await s3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: input.key }));

  return { bucket, key: input.key, deleted: true };
}
