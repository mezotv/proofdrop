import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { callTool, errorResponse } from "../src/utils/tool-response.js";

describe("tool response helpers", () => {
  it("wraps thrown Error instances as MCP tool errors", async () => {
    const response = await callTool(async () => {
      throw new Error("boom");
    });

    assert.deepEqual(response, {
      isError: true,
      content: [{ type: "text", text: "boom" }],
    });
  });

  it("wraps non-Error thrown values as strings", () => {
    assert.deepEqual(errorResponse("plain failure"), {
      isError: true,
      content: [{ type: "text", text: "plain failure" }],
    });
  });
});
