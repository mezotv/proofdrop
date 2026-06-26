---
name: attach-review-proof
description: Upload a local screenshot, GIF, or short video to temporary public storage and get a presigned URL to embed in a PR description, issue comment, or agent report. Use WHENEVER you (or another skill) have a local image/video that needs to be SHOWN to a human in GitHub — before/after design screenshots, a recorded flow, QA or canary evidence, "attach a screenshot/video to the PR". Prefer this over pasting local file paths, which GitHub cannot render.
---

# Attach Review Proof

Uploads a local file to the `proofdrop-mcp` server and returns a temporary presigned URL you can drop into GitHub markdown. Two tools (prefixed by your client, e.g. `mcp__proofdrop-mcp__upload_asset`):

- **`upload_asset`** — upload a local file, get back a URL.
- **`delete_asset`** — remove an object by its `key`.

## Upload

```json
{ "file_path": "screenshots/before.png", "expires_in_seconds": 604800 }
```

- `file_path` (required) — local path.
- `expires_in_seconds` (optional) — URL lifetime. Default `86400`, max `604800` (7 days). Use the max for PR-lifetime links.
- `content_type` (optional) — inferred from extension; pass `"video/mp4"` for `.mp4` (not auto-detected).

Returns `{ key, url, expiresAt, ... }`. Embed `url` as `![alt](url)` (or a `[link](url)` for video); keep `key` to `delete_asset` later. Max ~25 MB.

## Watch out

- **Public, short-lived only.** Anyone with the URL can fetch it. Use ONLY for review artifacts — never secrets, customer data, or private screenshots. `PROOFDROP_API_KEY` gates the endpoint, not the URLs.
- Upload *before* writing the PR/issue body so you paste real URLs.
