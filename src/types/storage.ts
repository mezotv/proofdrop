import type { Adapter, Files } from "files-sdk";

export type AssetStorageProvider = "s3" | "fs";

export type AssetStorage = {
  files: Files<Adapter>;
  provider: AssetStorageProvider;
  location: string;
  bucket?: string;
};
