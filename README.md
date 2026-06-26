# Proofdrop MCP

Small HTTP MCP server that lets agents drop temporary public review proofs into Neon storage and get a URL back.

The intended use case is screenshots and other review artifacts for GitHub PR descriptions, issue comments, and agent reports. Agents can upload the asset and embed the returned URL instead of creating throwaway branches, pushing binary files to unrelated repos, or abusing a burner repository.

## DISCLAIMER

This service is for PUBLIC, SHORT-LIVED REVIEW ASSETS ONLY.

Use it for GitHub PR screenshots, issue comments, agent reports, and other short-lived review artifacts that need image, screen recording, or screenshot URLs.

Do NOT upload internal documents, customer data, secrets, private product screenshots, credentials, unreleased confidential material, or anything that should stay private. Treat every returned URL as public to anyone who has it.

`PROOFDROP_API_KEY` can restrict who is allowed to call the hosted MCP endpoint, but it does not make uploaded images private. The uploaded asset URL is still shareable/public for as long as the URL works.

## Tools

- `upload_asset`: uploads a local file to Neon storage and returns a presigned GET URL.
- `delete_asset`: deletes an uploaded object by the returned S3 key.

Uploaded objects may be private at the bucket layer, but the returned URL is a public access capability for anyone who has it. The returned URL is temporary and expires according to `ASSET_URL_TTL_SECONDS` or the tool input.

## Setup

```bash
pnpm install
pnpm run build
```

Start the HTTP server:

```bash
pnpm run start
```

By default it listens on:

```text
http://localhost:3000/mcp
```

Set `MCP_PORT` to change the port.

Add the HTTP server to Codex:

```bash
npx add-mcp http://localhost:3000/mcp --name proofdrop-mcp --agent codex --global
```

For an API-key protected deployment:

```bash
npx add-mcp https://your-host.example/mcp --name proofdrop-mcp --agent codex --global --header 'Authorization: Bearer ${PROOFDROP_API_KEY}'
```

Codex does not start HTTP MCP servers for you. Keep `pnpm run start` or your hosted deployment running while Codex uses this MCP endpoint.

For local development:

```bash
pnpm run dev
```

## Configuration

- `AWS_ENDPOINT_URL_S3`: Neon S3 endpoint URL.
- `AWS_ACCESS_KEY_ID`: Neon storage access key ID.
- `AWS_SECRET_ACCESS_KEY`: Neon storage secret access key.
- `AWS_REGION`: Neon storage region.
- `AWS_S3_BUCKET_NAME`: target bucket name.
- `MCP_PORT`: optional HTTP port, defaults to `3000`.
- `PROOFDROP_API_KEY`: optional API key for hosted deployments. When set, `/mcp` requires `Authorization: Bearer <value>` or `X-API-Key: <value>`.
- `ASSET_KEY_PREFIX`: optional key prefix, defaults to `proofdrop`.
- `ASSET_URL_TTL_SECONDS`: optional default URL lifetime, defaults to `86400`.
- `MAX_ASSET_BYTES`: optional maximum local file size, defaults to `26214400`.

`S3_BUCKET_NAME` and `AWS_BUCKET_NAME` are accepted as bucket-name fallbacks, but `AWS_S3_BUCKET_NAME` is the preferred env var.

## Upload Example

Call `upload_asset` with:

```json
{
  "file_path": "/tmp/screenshot.png",
  "content_type": "image/png",
  "expires_in_seconds": 86400
}
```

The response includes:

```json
{
  "bucket": "example-bucket",
  "key": "proofdrop/2026-06-26/uuid-screenshot.png",
  "url": "https://...",
  "expiresAt": "2026-06-27T08:00:00.000Z",
  "contentType": "image/png",
  "sizeBytes": 12345
}
```

Use `url` in the PR description or comment. Keep `key` if you want to call `delete_asset` later.

## Temporary Object Cleanup

Presigned URLs expire automatically, but the underlying object remains in the bucket until deleted or expired by a bucket lifecycle rule. Configure a Neon/S3 lifecycle policy for the `ASSET_KEY_PREFIX` prefix if you want automatic cleanup.
