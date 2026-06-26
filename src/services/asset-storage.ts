import { readFile, stat } from "node:fs/promises";
import { MAX_ASSET_BYTES } from "../constants/asset.js";
import type { DeletedAsset, DeleteAssetInput, UploadedAsset, UploadAssetInput } from "../types/asset.js";
import { assetKey } from "../utils/asset-key.js";
import { inferContentType } from "../utils/content-type.js";
import { assetStorage } from "../utils/files-storage.js";
import { clampTtl } from "../utils/ttl.js";

export async function uploadAsset(input: UploadAssetInput): Promise<UploadedAsset> {
  const fileStat = await stat(input.file_path);

  if (!fileStat.isFile()) {
    throw new Error(`Not a regular file: ${input.file_path}`);
  }

  if (fileStat.size > MAX_ASSET_BYTES) {
    throw new Error(`File is ${fileStat.size} bytes, which exceeds MAX_ASSET_BYTES=${MAX_ASSET_BYTES}`);
  }

  const storage = assetStorage();
  const key = assetKey(input.file_path, input.key_prefix);
  const contentType = input.content_type ?? inferContentType(input.file_path);
  const body = await readFile(input.file_path);

  const ttl = clampTtl(input.expires_in_seconds);
  await storage.files.upload(key, body, { contentType });

  const expiresAt = storage.urlExpires ? new Date(Date.now() + ttl * 1000).toISOString() : undefined;
  const url = await storage.files.url(key, { expiresIn: ttl });

  return {
    bucket: storage.bucket,
    storageProvider: storage.provider,
    storageLocation: storage.location,
    key,
    url,
    urlExpires: storage.urlExpires,
    expiresAt,
    contentType,
    sizeBytes: fileStat.size,
  };
}

export async function deleteAsset(input: DeleteAssetInput): Promise<DeletedAsset> {
  const storage = assetStorage();
  await storage.files.delete(input.key);

  return {
    bucket: storage.bucket,
    storageProvider: storage.provider,
    storageLocation: storage.location,
    key: input.key,
    deleted: true,
  };
}
