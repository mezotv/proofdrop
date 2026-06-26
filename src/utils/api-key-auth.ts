import type { IncomingMessage } from "node:http";

export function requireApiKey(request: IncomingMessage, expectedApiKey: string | undefined): boolean {
  if (!expectedApiKey) {
    return true;
  }

  const authorization = headerValue(request.headers.authorization);
  const apiKey = headerValue(request.headers["x-api-key"]);

  return bearerToken(authorization) === expectedApiKey || apiKey === expectedApiKey;
}

function bearerToken(authorization: string | undefined): string | undefined {
  const [scheme, token] = authorization?.split(/\s+/, 2) ?? [];

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
