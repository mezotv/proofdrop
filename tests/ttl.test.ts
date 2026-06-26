import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clampTtl } from "../src/utils/ttl.js";

describe("TTL helper", () => {
  it("rejects non-finite TTL values", () => {
    assert.throws(() => clampTtl(Number.NaN), /finite number/);
    assert.throws(() => clampTtl(Infinity), /finite number/);
  });
});
