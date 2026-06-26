import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("asset storage validation", () => {
  let root: string;

  before(async () => {
    root = await mkdtemp(join(tmpdir(), "proofdrop-validation-"));

    process.env.FILES_ADAPTER = "fs";
    process.env.FILES_FS_ROOT = join(root, "storage");
    process.env.ASSET_KEY_PREFIX = "validation";
  });

  after(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("rejects paths that are not regular files", async () => {
    const directoryPath = join(root, "directory");
    await mkdir(directoryPath);

    const { uploadAsset } = await import("../src/services/asset-storage.js");

    await assert.rejects(
      () => uploadAsset({ file_path: directoryPath }),
      /Not a regular file:/,
    );
  });

  it("rejects files larger than the configured maximum", async () => {
    const largeFile = join(root, "large.bin");
    await writeFile(largeFile, "");
    await truncate(largeFile, 25 * 1024 * 1024 + 1);

    const { uploadAsset } = await import("../src/services/asset-storage.js");

    await assert.rejects(
      () => uploadAsset({ file_path: largeFile }),
      /exceeds MAX_ASSET_BYTES=/,
    );
  });
});
