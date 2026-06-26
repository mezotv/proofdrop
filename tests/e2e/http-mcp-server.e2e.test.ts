import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Server } from "node:http";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startHttpMcpServer } from "../../src/server/http-mcp-server.js";

describe("HTTP MCP server e2e", () => {
  let client: Client;
  let root: string;
  let server: Server;
  let sourceFile: string;
  let transport: StreamableHTTPClientTransport;

  before(async () => {
    root = await mkdtemp(join(tmpdir(), "proofdrop-e2e-"));
    sourceFile = join(root, "proof.txt");
    await writeFile(sourceFile, "proofdrop e2e asset\n");

    process.env.FILES_ADAPTER = "fs";
    process.env.FILES_FS_ROOT = join(root, "storage");
    process.env.ASSET_KEY_PREFIX = "e2e";

    server = await startHttpMcpServer({
      apiKey: undefined,
      healthPath: "/health",
      mcpPath: "/mcp",
      port: 0,
    });

    const address = server.address();
    assert(address && typeof address === "object");

    client = new Client({ name: "proofdrop-e2e-test", version: "1.0.0" }, { capabilities: {} });
    transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`));
    await client.connect(transport);
  });

  after(async () => {
    await client?.close();
    await transport?.close().catch(() => undefined);
    await closeServer(server);
    await rm(root, { recursive: true, force: true });
  });

  it("lists asset tools and uploads/deletes an asset over MCP HTTP", async () => {
    const tools = await client.listTools();
    assert.deepEqual(
      tools.tools.map((tool) => tool.name).sort(),
      ["delete_asset", "upload_asset"],
    );

    const uploadResult = await client.callTool({
      name: "upload_asset",
      arguments: {
        file_path: sourceFile,
        key_prefix: "e2e",
        expires_in_seconds: 60,
      },
    });
    assert.equal(uploadResult.isError, undefined);

    const uploaded = parseToolJson(uploadResult);
    assert.equal(uploaded.storageProvider, "fs");
    assert.equal(uploaded.storageLocation, process.env.FILES_FS_ROOT);
    assert.match(uploaded.key, /^e2e\/\d{4}-\d{2}-\d{2}\/.+-proof\.txt$/);
    assert.equal(uploaded.url.startsWith("file://"), true);
    assert.equal(uploaded.urlExpires, false);
    assert.equal(uploaded.expiresAt, undefined);
    assert.equal(uploaded.contentType, "text/plain");
    assert.equal(uploaded.sizeBytes, Buffer.byteLength("proofdrop e2e asset\n"));

    const storedPath = join(process.env.FILES_FS_ROOT!, uploaded.key);
    assert.equal(await readFile(storedPath, "utf8"), "proofdrop e2e asset\n");

    const deleteResult = await client.callTool({
      name: "delete_asset",
      arguments: {
        key: uploaded.key,
      },
    });
    assert.equal(deleteResult.isError, undefined);

    const deleted = parseToolJson(deleteResult);
    assert.equal(deleted.deleted, true);
    assert.equal(deleted.key, uploaded.key);
    assert.equal(deleted.storageProvider, "fs");

    await assert.rejects(stat(storedPath));
  });
});

describe("HTTP server edge e2e", () => {
  let server: Server;
  let serverUrl: string;

  before(async () => {
    server = await startHttpMcpServer({
      apiKey: "secret-key",
      healthPath: "/health",
      mcpPath: "/mcp",
      port: 0,
    });

    const address = server.address();
    assert(address && typeof address === "object");
    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await closeServer(server);
  });

  it("responds to health checks and preflight requests", async () => {
    const health = await fetch(`${serverUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal(health.headers.get("access-control-allow-origin"), "*");
    assert.deepEqual(await health.json(), { ok: true });

    const preflight = await fetch(`${serverUrl}/mcp`, { method: "OPTIONS" });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-methods"), "GET, HEAD, OPTIONS, POST");
  });

  it("returns JSON-RPC errors for invalid paths and methods", async () => {
    const notFound = await fetch(`${serverUrl}/missing`);
    assert.equal(notFound.status, 404);
    assert.equal((await notFound.json()).error.message, "Not found.");

    const healthMethod = await fetch(`${serverUrl}/health`, { method: "POST" });
    assert.equal(healthMethod.status, 405);
    assert.equal(healthMethod.headers.get("allow"), "GET, HEAD, OPTIONS");

    const mcpMethod = await fetch(`${serverUrl}/mcp`, {
      headers: { authorization: "Bearer secret-key" },
    });
    assert.equal(mcpMethod.status, 405);
    assert.equal(mcpMethod.headers.get("allow"), "POST, OPTIONS");
  });

  it("enforces API keys and accepts bearer or x-api-key credentials", async () => {
    const unauthorized = await fetch(`${serverUrl}/mcp`, { method: "POST" });
    assert.equal(unauthorized.status, 401);
    assert.match(unauthorized.headers.get("www-authenticate") ?? "", /invalid_token/);

    const bearerClient = new Client({ name: "proofdrop-bearer-e2e", version: "1.0.0" }, { capabilities: {} });
    const bearerTransport = new StreamableHTTPClientTransport(new URL(`${serverUrl}/mcp`), {
      requestInit: { headers: { authorization: "Bearer secret-key" } },
    });
    await bearerClient.connect(bearerTransport);
    assert.equal((await bearerClient.listTools()).tools.length, 2);
    await bearerClient.close();

    const apiKeyClient = new Client({ name: "proofdrop-api-key-e2e", version: "1.0.0" }, { capabilities: {} });
    const apiKeyTransport = new StreamableHTTPClientTransport(new URL(`${serverUrl}/mcp`), {
      requestInit: { headers: { "x-api-key": "secret-key" } },
    });
    await apiKeyClient.connect(apiKeyTransport);
    assert.equal((await apiKeyClient.listTools()).tools.length, 2);
    await apiKeyClient.close();
  });
});

function parseToolJson(result: Awaited<ReturnType<Client["callTool"]>>) {
  const [content] = "content" in result ? result.content : [];

  assert(content);
  assert.equal(content.type, "text");

  return JSON.parse(content.text) as Record<string, string | number | boolean | undefined>;
}

async function closeServer(server: Server | undefined): Promise<void> {
  if (!server) {
    return;
  }

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
