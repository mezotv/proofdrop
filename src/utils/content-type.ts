import { extname } from "node:path";
import { CONTENT_TYPES_BY_EXTENSION, DEFAULT_CONTENT_TYPE } from "../constants/content-type.js";

export function inferContentType(path: string): string {
  const extension = extname(path).toLowerCase();

  return CONTENT_TYPES_BY_EXTENSION[extension] ?? DEFAULT_CONTENT_TYPE;
}
