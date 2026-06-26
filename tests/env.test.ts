import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { bucketName, optionalEnv, requiredAnyEnv, requiredEnv } from "../src/utils/env.js";

const ENV_KEYS = ["ENV_TEST_A", "ENV_TEST_B", "FILES_BUCKET", "FILES_S3_BUCKET", "AWS_S3_BUCKET_NAME", "S3_BUCKET_NAME", "AWS_BUCKET_NAME"];
const originalEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

describe("environment helpers", () => {
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

  it("reads required and optional environment variables", () => {
    process.env.ENV_TEST_B = "value-b";

    assert.equal(optionalEnv("ENV_TEST_A", "ENV_TEST_B"), "value-b");
    assert.equal(requiredAnyEnv("ENV_TEST_A", "ENV_TEST_B"), "value-b");

    process.env.ENV_TEST_A = "value-a";
    assert.equal(requiredEnv("ENV_TEST_A"), "value-a");
  });

  it("throws clear errors for missing required environment variables", () => {
    delete process.env.ENV_TEST_A;
    delete process.env.ENV_TEST_B;

    assert.throws(() => requiredEnv("ENV_TEST_A"), /Missing required environment variable: ENV_TEST_A/);
    assert.throws(() => requiredAnyEnv("ENV_TEST_A", "ENV_TEST_B"), /ENV_TEST_A or ENV_TEST_B/);
  });

  it("uses FILES_BUCKET before bucket-name fallback variables", () => {
    process.env.AWS_BUCKET_NAME = "aws-bucket";
    process.env.FILES_BUCKET = "files-bucket";

    assert.equal(bucketName(), "files-bucket");
  });

  it("throws when no bucket-name variable is configured", () => {
    for (const key of ["FILES_BUCKET", "FILES_S3_BUCKET", "AWS_S3_BUCKET_NAME", "S3_BUCKET_NAME", "AWS_BUCKET_NAME"]) {
      delete process.env[key];
    }

    assert.throws(() => bucketName(), /Missing required environment variable: FILES_BUCKET/);
  });
});
