import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("files-sdk storage factory validation", () => {
  it("rejects unsupported adapter names", async () => {
    process.env.FILES_ADAPTER = "unknown";

    const { assetStorage } = await import("../src/utils/files-storage.js");

    assert.throws(() => assetStorage(), /Unsupported FILES_ADAPTER="unknown"/);
  });
});
