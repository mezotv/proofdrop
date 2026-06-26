export function sanitizePathPart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._/-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, ".");
}
