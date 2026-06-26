import {
  API_KEY_ENV_VAR,
  DEFAULT_HTTP_PORT,
  HEALTH_PATH,
  MCP_PORT_ENV_VAR,
  MCP_PATH,
} from "../constants/http.js";
import type { HttpServerConfig } from "../types/http.js";

export function httpServerConfig(): HttpServerConfig {
  return {
    apiKey: process.env[API_KEY_ENV_VAR],
    healthPath: HEALTH_PATH,
    mcpPath: MCP_PATH,
    port: parseHttpPort(process.env[MCP_PORT_ENV_VAR]),
  };
}

function parseHttpPort(value: string | undefined): number {
  const port = value ? Number(value) : DEFAULT_HTTP_PORT;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${MCP_PORT_ENV_VAR} must be an integer between 1 and 65535`);
  }

  return port;
}
