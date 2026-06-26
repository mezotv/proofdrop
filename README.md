# Proofdrop MCP

[![attach-review-proof installs](https://shieldcn.dev/skills/installs/mezotv/proofdrop/attach-review-proof.svg?label=attach-review-proof)](https://www.skills.sh/mezotv/proofdrop/attach-review-proof)

Small HTTP MCP server that lets agents drop temporary public review proofs into configurable [files-sdk](https://files-sdk.dev/) storage and get a URL back.

The intended use case is screenshots and other review artifacts for GitHub PR descriptions, issue comments, and agent reports. Agents can upload the asset and embed the returned URL instead of creating throwaway branches, pushing binary files to unrelated repos, or abusing a burner repository.

## DISCLAIMER

This service is for PUBLIC, SHORT-LIVED REVIEW ASSETS ONLY.

Use it for GitHub PR screenshots, issue comments, agent reports, and other short-lived review artifacts that need image, screen recording, or screenshot URLs.

Do NOT upload internal documents, customer data, secrets, private product screenshots, credentials, unreleased confidential material, or anything that should stay private. Treat every returned URL as public to anyone who has it.

`PROOFDROP_API_KEY` can restrict who is allowed to call the hosted MCP endpoint, but it does not make uploaded images private. The uploaded asset URL is still shareable/public for as long as the URL works.

## Tools

- `upload_asset`: uploads a local file to the configured files-sdk storage adapter and returns a URL.
- `delete_asset`: deletes an uploaded object by the returned storage key.

Uploaded objects may be private at the storage layer, but the returned URL is a public access capability for anyone who has it. For signing adapters, the returned URL expires according to `ASSET_URL_TTL_SECONDS` or the tool input. For public/CDN/static adapters, the URL may not expire.

## Storage

Proofdrop uses [haydenbleasel/files-sdk](https://files-sdk.dev/) so review artifacts are not tied to Neon. The default adapter is generic S3-compatible storage, which works with AWS S3, Neon object storage, Cloudflare R2 S3-compatible HTTP credentials, MinIO, Tigris, and similar services.

Set `FILES_ADAPTER=s3` for S3-compatible storage, or `FILES_ADAPTER=fs` for local dev/CI storage.

Useful files-sdk docs:

- [Overview](https://files-sdk.dev/)
- [S3 adapter](https://files-sdk.dev/adapters/s3)
- [Filesystem adapter](https://files-sdk.dev/adapters/fs)
- [URL API](https://files-sdk.dev/api/url)

## Setup

```bash
pnpm install
pnpm run build
```

Requires Node.js 22.12.0 or newer.

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

- `FILES_ADAPTER`: storage adapter, either `s3` or `fs`. Defaults to `s3`.
- `MCP_PORT`: optional HTTP port, defaults to `3000`.
- `PROOFDROP_API_KEY`: optional API key for hosted deployments. When set, `/mcp` requires `Authorization: Bearer <value>` or `X-API-Key: <value>`.
- `ASSET_KEY_PREFIX`: optional key prefix, defaults to `proofdrop`.
- `ASSET_URL_TTL_SECONDS`: optional default URL lifetime, defaults to `86400`.
- `MAX_ASSET_BYTES`: optional maximum local file size, defaults to `26214400`.

### S3-compatible storage

- `FILES_BUCKET`: target bucket name.
- `FILES_S3_ENDPOINT`: optional S3-compatible endpoint URL. Falls back to `AWS_ENDPOINT_URL_S3`.
- `FILES_S3_REGION`: optional signing region. Falls back to `AWS_REGION`, then `AWS_DEFAULT_REGION`, then `auto`.
- `FILES_S3_ACCESS_KEY_ID`: optional static access key ID. Falls back to `AWS_ACCESS_KEY_ID`.
- `FILES_S3_SECRET_ACCESS_KEY`: optional static secret access key. Falls back to `AWS_SECRET_ACCESS_KEY`.
- `FILES_S3_SESSION_TOKEN`: optional static session token. Falls back to `AWS_SESSION_TOKEN`.
- `FILES_S3_FORCE_PATH_STYLE`: optional boolean, defaults to `true` for S3-compatible providers.
- `FILES_PUBLIC_BASE_URL`: optional public/CDN/custom-domain base URL. When set, `upload_asset` returns `${FILES_PUBLIC_BASE_URL}/${key}` instead of a signed URL.

`FILES_S3_BUCKET`, `AWS_S3_BUCKET_NAME`, `S3_BUCKET_NAME`, and `AWS_BUCKET_NAME` are accepted as bucket-name fallbacks.

### Local filesystem storage

- `FILES_ADAPTER=fs`: use files-sdk's local filesystem adapter.
- `FILES_FS_ROOT`: optional storage root, defaults to `.proofdrop-assets`.
- `FILES_PUBLIC_BASE_URL`: optional HTTP base URL if another server exposes `FILES_FS_ROOT`.

Without `FILES_PUBLIC_BASE_URL`, the filesystem adapter returns `file://` URLs, which are useful for local tests but not for browser-visible PR comments.

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
  "storageProvider": "s3",
  "storageLocation": "example-bucket",
  "key": "proofdrop/2026-06-26/uuid-screenshot.png",
  "url": "https://...",
  "urlExpires": true,
  "expiresAt": "2026-06-27T08:00:00.000Z",
  "contentType": "image/png",
  "sizeBytes": 12345
}
```

`expiresAt` is included only when the returned URL is signed and actually expires. Public/CDN/static URLs include `"urlExpires": false` and do not include `expiresAt`.

Use `url` in the PR description or comment. Keep `key` if you want to call `delete_asset` later.

## Temporary Object Cleanup

Signed URLs expire automatically, but the underlying object remains in storage until deleted or expired by a provider lifecycle rule. Configure cleanup for the `ASSET_KEY_PREFIX` prefix in your storage provider if you want automatic retention.
