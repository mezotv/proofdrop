import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("files-sdk default S3-compatible storage factory", () => {
  it("defaults to S3-compatible storage with bucket metadata", async () => {
    process.env.FILES_BUCKET = "proofdrop-bucket";

    const { assetStorage } = await import("../src/utils/files-storage.js");
    const storage = assetStorage();

    assert.equal(storage.provider, "s3");
    assert.equal(storage.location, "proofdrop-bucket");
    assert.equal(storage.bucket, "proofdrop-bucket");
  });
});
