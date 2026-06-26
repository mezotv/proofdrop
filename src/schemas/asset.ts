import { z } from "zod";
import { MAX_URL_TTL_SECONDS } from "../constants/asset.js";

export const uploadAssetInputShape = {
  file_path: z.string().min(1).describe("Absolute or working-directory-relative path to the local file to upload."),
  content_type: z.string().min(1).optional().describe("Optional MIME type override. Inferred from the file extension by default."),
  key_prefix: z.string().min(1).optional().describe("Optional S3 key prefix. Defaults to ASSET_KEY_PREFIX or 'agent-assets'."),
  expires_in_seconds: z
    .number()
    .int()
    .min(60)
    .max(MAX_URL_TTL_SECONDS)
    .optional()
    .describe("Temporary URL lifetime in seconds. Defaults to ASSET_URL_TTL_SECONDS or 86400. Max is 604800."),
};

export const uploadAssetInputObjectSchema = z.object(uploadAssetInputShape);

export const deleteAssetInputShape = {
  key: z.string().min(1).describe("S3 object key returned by upload_asset."),
};

export const deleteAssetInputObjectSchema = z.object(deleteAssetInputShape);
