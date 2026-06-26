#!/usr/bin/env node

import "dotenv/config";
import { startHttpMcpServer } from "./server/http-mcp-server.js";

const server = await startHttpMcpServer();

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.error(`Received ${signal}, shutting down proofdrop-mcp`);
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

process.once("SIGINT", (signal) => {
  void shutdown(signal)
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error("Failed to shut down proofdrop-mcp:", error);
      process.exit(1);
    });
});

process.once("SIGTERM", (signal) => {
  void shutdown(signal)
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error("Failed to shut down proofdrop-mcp:", error);
      process.exit(1);
    });
});
