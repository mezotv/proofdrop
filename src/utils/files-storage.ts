import { Files } from "files-sdk";
import { fs } from "files-sdk/fs";
import { s3 } from "files-sdk/s3";
import { DEFAULT_URL_TTL_SECONDS } from "../constants/asset.js";
import { DEFAULT_FILES_ADAPTER, DEFAULT_FILES_FS_ROOT } from "../constants/storage.js";
import type { AssetStorage, AssetStorageProvider } from "../types/storage.js";
import { bucketName, optionalEnv, requiredAnyEnv } from "./env.js";

let cachedStorage: AssetStorage | undefined;

export function assetStorage(): AssetStorage {
  cachedStorage ??= createAssetStorage();

  return cachedStorage;
}

function createAssetStorage(): AssetStorage {
  const provider = filesAdapter();
  const publicBaseUrl = optionalEnv("FILES_PUBLIC_BASE_URL", "ASSET_PUBLIC_BASE_URL");

  if (provider === "fs") {
    const root = optionalEnv("FILES_FS_ROOT", "ASSET_FS_ROOT") ?? DEFAULT_FILES_FS_ROOT;

    return {
      files: new Files({
        adapter: fs({
          root,
          urlBaseUrl: publicBaseUrl,
          defaultUrlExpiresIn: DEFAULT_URL_TTL_SECONDS,
        }),
      }),
      provider,
      location: root,
    };
  }

  const bucket = bucketName();

  return {
    files: new Files({
      adapter: s3({
        bucket,
        region: optionalEnv("FILES_S3_REGION", "AWS_REGION", "AWS_DEFAULT_REGION") ?? "auto",
        endpoint: optionalEnv("FILES_S3_ENDPOINT", "AWS_ENDPOINT_URL_S3"),
        forcePathStyle: filesS3ForcePathStyle(),
        credentials: filesS3Credentials(),
        publicBaseUrl,
        defaultUrlExpiresIn: DEFAULT_URL_TTL_SECONDS,
      }),
    }),
    provider,
    location: bucket,
    bucket,
  };
}

function filesAdapter(): AssetStorageProvider {
  const adapter = (process.env.FILES_ADAPTER ?? DEFAULT_FILES_ADAPTER).toLowerCase();

  if (adapter === "s3" || adapter === "fs") {
    return adapter;
  }

  throw new Error(`Unsupported FILES_ADAPTER="${adapter}". Expected "s3" or "fs".`);
}

function filesS3Credentials() {
  const accessKeyId = optionalEnv("FILES_S3_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID");
  const secretAccessKey = optionalEnv("FILES_S3_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY");
  const sessionToken = optionalEnv("FILES_S3_SESSION_TOKEN", "AWS_SESSION_TOKEN");

  if (!accessKeyId && !secretAccessKey && !sessionToken) {
    return undefined;
  }

  return {
    accessKeyId: accessKeyId ?? requiredAnyEnv("FILES_S3_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID"),
    secretAccessKey: secretAccessKey ?? requiredAnyEnv("FILES_S3_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY"),
    sessionToken,
  };
}

function filesS3ForcePathStyle(): boolean {
  const value = optionalEnv("FILES_S3_FORCE_PATH_STYLE", "AWS_S3_FORCE_PATH_STYLE");

  if (!value) {
    return true;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
