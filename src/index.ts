#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants/server.js";
import { registerAssetTools } from "./tools/asset-tools.js";

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

registerAssetTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
