# CDN MCP

Small stdio MCP server that lets agents upload temporary assets to Neon S3-compatible storage and get a URL back.

The intended use case is screenshots and other review artifacts for GitHub PR descriptions, issue comments, and agent reports. Agents can upload the asset and embed the returned URL instead of creating throwaway branches, pushing binary files to unrelated repos, or abusing a burner repository.

## Tools

- `upload_asset`: uploads a local file to S3-compatible storage and returns a presigned GET URL.
- `delete_asset`: deletes an uploaded object by the returned S3 key.

Uploaded objects are private by default. The returned URL is temporary and expires according to `ASSET_URL_TTL_SECONDS` or the tool input.

## Setup

```bash
npm install
npm run build
```

Add the built server to an MCP client:

```json
{
  "mcpServers": {
    "cdn-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/cdn-mcp/dist/index.js"]
    }
  }
}
```

For local development:

```bash
npm run dev
```

## Configuration

- `AWS_ENDPOINT_URL_S3`: Neon S3 endpoint URL.
- `AWS_ACCESS_KEY_ID`: Neon storage access key ID.
- `AWS_SECRET_ACCESS_KEY`: Neon storage secret access key.
- `AWS_REGION`: Neon storage region.
- `AWS_S3_BUCKET_NAME`: target bucket name.
- `ASSET_KEY_PREFIX`: optional key prefix, defaults to `agent-assets`.
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
  "key": "agent-assets/2026-06-26/uuid-screenshot.png",
  "url": "https://...",
  "expiresAt": "2026-06-27T08:00:00.000Z",
  "contentType": "image/png",
  "sizeBytes": 12345
}
```

Use `url` in the PR description or comment. Keep `key` if you want to call `delete_asset` later.

## Temporary Object Cleanup

Presigned URLs expire automatically, but the underlying object remains in the bucket until deleted or expired by a bucket lifecycle rule. Configure a Neon/S3 lifecycle policy for the `ASSET_KEY_PREFIX` prefix if you want automatic cleanup.
