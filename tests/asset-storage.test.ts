import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("asset storage", () => {
  let root: string;
  let sourceFile: string;

  before(async () => {
    root = await mkdtemp(join(tmpdir(), "proofdrop-test-"));
    sourceFile = join(root, "review-proof.txt");
    await writeFile(sourceFile, "proofdrop test asset\n");

    process.env.FILES_ADAPTER = "fs";
    process.env.FILES_FS_ROOT = join(root, "storage");
    process.env.ASSET_KEY_PREFIX = "tests";
  });

  after(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("uploads through files-sdk fs storage, returns a URL, and deletes by key", async () => {
    const { deleteAsset, uploadAsset } = await import("../src/services/asset-storage.js");

    const uploaded = await uploadAsset({
      file_path: sourceFile,
    });

    assert.equal(uploaded.bucket, undefined);
    assert.equal(uploaded.storageProvider, "fs");
    assert.equal(uploaded.storageLocation, process.env.FILES_FS_ROOT);
    assert.match(uploaded.key, /^tests\/\d{4}-\d{2}-\d{2}\/.+-review-proof\.txt$/);
    assert.equal(uploaded.url.startsWith("file://"), true);
    assert.equal(uploaded.urlExpires, false);
    assert.equal(uploaded.expiresAt, undefined);
    assert.equal(uploaded.contentType, "text/plain");
    assert.equal(uploaded.sizeBytes, Buffer.byteLength("proofdrop test asset\n"));

    const storedPath = join(process.env.FILES_FS_ROOT!, uploaded.key);
    assert.equal(await readFile(storedPath, "utf8"), "proofdrop test asset\n");

    const deleted = await deleteAsset({ key: uploaded.key });

    assert.deepEqual(deleted, {
      bucket: undefined,
      storageProvider: "fs",
      storageLocation: process.env.FILES_FS_ROOT,
      key: uploaded.key,
      deleted: true,
    });

    await assert.rejects(stat(storedPath));
  });
});
