import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { MCP_PATH } from "../constants/http.js";
import type { HttpServerConfig } from "../types/http.js";
import { requireApiKey } from "../utils/api-key-auth.js";
import { httpServerConfig } from "../utils/http-config.js";
import {
  sendHealthResponse,
  sendInternalServerErrorResponse,
  sendMethodNotAllowedResponse,
  sendNotFoundResponse,
  sendNoContentResponse,
  sendUnauthorizedResponse,
  setCorsHeaders,
} from "../utils/http-response.js";
import { createMcpServer } from "./create-mcp-server.js";

export async function startHttpMcpServer(config: HttpServerConfig = httpServerConfig()): Promise<Server> {
  const server = createServer((request, response) => {
    void handleRequest(request, response, config).catch((error: unknown) => {
      console.error("Error handling HTTP request:", error);
      sendInternalServerErrorResponse(response);
    });
  });

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      server.off("error", onError);
      server.off("listening", onListening);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(config.port);
  });

  console.error(`proofdrop-mcp listening at http://localhost:${config.port}${MCP_PATH}`);

  return server;
}

async function handleRequest(request: IncomingMessage, response: ServerResponse, config: HttpServerConfig): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? `localhost:${config.port}`}`);

  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    sendNoContentResponse(response);
    return;
  }

  if (requestUrl.pathname === config.healthPath) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendMethodNotAllowedResponse(response, ["GET", "HEAD", "OPTIONS"]);
      return;
    }

    sendHealthResponse(response);
    return;
  }

  if (requestUrl.pathname !== config.mcpPath) {
    sendNotFoundResponse(response);
    return;
  }

  if (!requireApiKey(request, config.apiKey)) {
    sendUnauthorizedResponse(response);
    return;
  }

  if (request.method !== "POST") {
    sendMethodNotAllowedResponse(response, ["POST", "OPTIONS"]);
    return;
  }

  await handleMcpRequest(request, response);
}

async function handleMcpRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });

  response.on("close", () => {
    void transport.close().catch((error: unknown) => console.error("Error closing MCP transport:", error));
    void mcpServer.close().catch((error: unknown) => console.error("Error closing MCP server:", error));
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(request, response);
}
