import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("files-sdk filesystem storage factory", () => {
  it("creates and caches filesystem storage", async () => {
    process.env.FILES_ADAPTER = "fs";
    process.env.FILES_FS_ROOT = "/tmp/proofdrop-fs-test";
    process.env.FILES_PUBLIC_BASE_URL = "https://assets.example.test";

    const { assetStorage } = await import("../src/utils/files-storage.js");
    const storage = assetStorage();

    assert.equal(storage.provider, "fs");
    assert.equal(storage.location, "/tmp/proofdrop-fs-test");
    assert.equal(storage.bucket, undefined);
    assert.strictEqual(assetStorage(), storage);
  });
});
