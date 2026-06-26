import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sendInternalServerErrorResponse, sendNotFoundResponse } from "../src/utils/http-response.js";

describe("HTTP response helpers", () => {
  it("does not write internal-server-error responses after headers are sent", () => {
    const response = mockResponse(true);

    sendInternalServerErrorResponse(response);

    assert.equal(response.writeHeadCalls, 0);
    assert.equal(response.endCalls, 0);
  });

  it("does not write JSON responses after headers are sent", () => {
    const response = mockResponse(true);

    sendNotFoundResponse(response);

    assert.equal(response.writeHeadCalls, 0);
    assert.equal(response.endCalls, 0);
  });
});

function mockResponse(headersSent: boolean) {
  return {
    headersSent,
    writeHeadCalls: 0,
    endCalls: 0,
    setHeader() {
      return this;
    },
    writeHead() {
      this.writeHeadCalls += 1;
      return this;
    },
    end() {
      this.endCalls += 1;
      return this;
    },
  } as unknown as { headersSent: boolean; writeHeadCalls: number; endCalls: number } & Parameters<typeof sendNotFoundResponse>[0];
}
