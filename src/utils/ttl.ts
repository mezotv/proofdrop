import { DEFAULT_URL_TTL_SECONDS, MAX_URL_TTL_SECONDS, MIN_URL_TTL_SECONDS } from "../constants/asset.js";

export function clampTtl(seconds: number | undefined): number {
  const ttl = seconds ?? DEFAULT_URL_TTL_SECONDS;

  if (!Number.isFinite(ttl)) {
    throw new Error("expires_in_seconds must be a finite number");
  }

  return Math.max(MIN_URL_TTL_SECONDS, Math.min(Math.floor(ttl), MAX_URL_TTL_SECONDS));
}
