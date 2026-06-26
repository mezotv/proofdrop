import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { httpServerConfig } from "../src/utils/http-config.js";

const ENV_KEYS = ["MCP_PORT", "PROOFDROP_API_KEY"];
const originalEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

describe("HTTP config", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      const originalValue = originalEnv.get(key);

      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  });

  it("uses defaults when env vars are unset", () => {
    delete process.env.MCP_PORT;
    delete process.env.PROOFDROP_API_KEY;

    assert.deepEqual(httpServerConfig(), {
      apiKey: undefined,
      healthPath: "/health",
      mcpPath: "/mcp",
      port: 3000,
    });
  });

  it("parses configured port and API key", () => {
    process.env.MCP_PORT = "4321";
    process.env.PROOFDROP_API_KEY = "secret";

    assert.equal(httpServerConfig().port, 4321);
    assert.equal(httpServerConfig().apiKey, "secret");
  });

  it("rejects invalid ports", () => {
    process.env.MCP_PORT = "0";
    assert.throws(() => httpServerConfig(), /MCP_PORT must be an integer/);

    process.env.MCP_PORT = "65536";
    assert.throws(() => httpServerConfig(), /MCP_PORT must be an integer/);

    process.env.MCP_PORT = "not-a-number";
    assert.throws(() => httpServerConfig(), /MCP_PORT must be an integer/);
  });
});
