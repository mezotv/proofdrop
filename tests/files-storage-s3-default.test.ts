import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";

const ENV_KEYS = ["FILES_ADAPTER", "FILES_BUCKET"];
const originalEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

describe("files-sdk default S3-compatible storage factory", () => {
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

  it("defaults to S3-compatible storage with bucket metadata", async () => {
    delete process.env.FILES_ADAPTER;
    process.env.FILES_BUCKET = "proofdrop-bucket";

    const { assetStorage } = await import("../src/utils/files-storage.js");
    const storage = assetStorage();

    assert.equal(storage.provider, "s3");
    assert.equal(storage.location, "proofdrop-bucket");
    assert.equal(storage.urlExpires, true);
    assert.equal(storage.bucket, "proofdrop-bucket");
  });
});
