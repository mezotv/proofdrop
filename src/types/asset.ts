import type { z } from "zod";
import type { deleteAssetInputObjectSchema, uploadAssetInputObjectSchema } from "../schemas/asset.js";

export type DeleteAssetInput = z.infer<typeof deleteAssetInputObjectSchema>;

export type DeletedAsset = {
  bucket: string;
  key: string;
  deleted: true;
};

export type UploadAssetInput = z.infer<typeof uploadAssetInputObjectSchema>;

export type UploadedAsset = {
  bucket: string;
  key: string;
  url: string;
  expiresAt: string;
  contentType: string;
  sizeBytes: number;
};
