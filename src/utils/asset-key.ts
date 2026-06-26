import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { DEFAULT_KEY_PREFIX } from "../constants/asset.js";
import { sanitizePathPart } from "./sanitize-path-part.js";

export function assetKey(filePath: string, keyPrefix?: string): string {
  const prefix = sanitizePathPart(keyPrefix ?? DEFAULT_KEY_PREFIX) || "proofdrop";
  const date = new Date().toISOString().slice(0, 10);
  const fileName = sanitizePathPart(basename(filePath)) || "asset";

  return `${prefix}/${date}/${randomUUID()}-${fileName}`;
}
