export const DEFAULT_KEY_PREFIX = process.env.ASSET_KEY_PREFIX ?? "proofdrop";
export const DEFAULT_URL_TTL_SECONDS = Number(process.env.ASSET_URL_TTL_SECONDS ?? 86_400);
export const MAX_ASSET_BYTES = Number(process.env.MAX_ASSET_BYTES ?? 25 * 1024 * 1024);
export const MAX_URL_TTL_SECONDS = 604_800;
export const MIN_URL_TTL_SECONDS = 60;
