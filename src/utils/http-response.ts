import type { ServerResponse } from "node:http";
import { API_KEY_ENV_VAR } from "../constants/http.js";
import { SERVER_NAME } from "../constants/server.js";

export function setCorsHeaders(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, content-type, last-event-id, mcp-protocol-version, mcp-session-id, x-api-key",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST");
  response.setHeader("Access-Control-Expose-Headers", "mcp-protocol-version, mcp-session-id");
}

export function sendHealthResponse(response: ServerResponse): void {
  sendJsonResponse(response, 200, { ok: true });
}

export function sendInternalServerErrorResponse(response: ServerResponse): void {
  if (response.headersSent) {
    return;
  }

  sendJsonRpcErrorResponse(response, 500, -32603, "Internal server error");
}

export function sendMethodNotAllowedResponse(response: ServerResponse, allowedMethods: string[]): void {
  response.setHeader("Allow", allowedMethods.join(", "));
  sendJsonRpcErrorResponse(response, 405, -32000, "Method not allowed.");
}

export function sendNoContentResponse(response: ServerResponse): void {
  response.writeHead(204);
  response.end();
}

export function sendNotFoundResponse(response: ServerResponse): void {
  sendJsonRpcErrorResponse(response, 404, -32000, "Not found.");
}

export function sendUnauthorizedResponse(response: ServerResponse): void {
  response.setHeader("WWW-Authenticate", `Bearer realm="${SERVER_NAME}", error="invalid_token"`);
  sendJsonRpcErrorResponse(response, 401, -32000, `Unauthorized. Set Authorization: Bearer using ${API_KEY_ENV_VAR}.`);
}

function sendJsonRpcErrorResponse(response: ServerResponse, statusCode: number, code: number, message: string): void {
  sendJsonResponse(response, statusCode, {
    jsonrpc: "2.0",
    error: {
      code,
      message,
    },
    id: null,
  });
}

function sendJsonResponse(response: ServerResponse, statusCode: number, data: unknown): void {
  if (response.headersSent) {
    return;
  }

  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}
