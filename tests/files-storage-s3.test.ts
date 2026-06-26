import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("files-sdk S3-compatible storage factory", () => {
  it("creates S3-compatible storage from explicit files-sdk env vars", async () => {
    process.env.FILES_ADAPTER = "s3";
    process.env.FILES_BUCKET = "explicit-bucket";
    process.env.FILES_S3_ACCESS_KEY_ID = "access-key";
    process.env.FILES_S3_ENDPOINT = "https://s3.example.test";
    process.env.FILES_S3_FORCE_PATH_STYLE = "false";
    process.env.FILES_S3_REGION = "us-test-1";
    process.env.FILES_S3_SECRET_ACCESS_KEY = "secret-key";
    process.env.FILES_S3_SESSION_TOKEN = "session-token";
    process.env.FILES_PUBLIC_BASE_URL = "https://cdn.example.test";

    const { assetStorage } = await import("../src/utils/files-storage.js");
    const storage = assetStorage();

    assert.equal(storage.provider, "s3");
    assert.equal(storage.location, "explicit-bucket");
    assert.equal(storage.urlExpires, false);
    assert.equal(storage.bucket, "explicit-bucket");
  });
});
