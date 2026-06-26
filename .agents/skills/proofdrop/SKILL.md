---
name: proofdrop
description: Upload a local screenshot, GIF, or short video to temporary public storage and get a presigned URL to embed in a PR description, issue comment, or agent report. Use this skill WHENEVER you (or another skill) have produced a local image/video file that needs to be SHOWN to a human in GitHub — e.g. before/after screenshots for a design review, a recorded GIF of a flow, QA evidence, a canary/deploy screenshot, or "attach a screenshot/video to the PR". Trigger on phrases like "attach this to the PR", "put a screenshot in the description", "add a recording", "embed this image", or any time a workflow generates `.png/.jpg/.gif/.webp/.mp4` proof that GitHub markdown can't reference from a local path. Prefer this over pasting local file paths, which GitHub cannot render.
---

# Proofdrop

Drops a local file into S3-compatible storage (Neon) and returns a **temporary presigned URL** you can embed directly in GitHub markdown. This is the bridge between local proof files (screenshots, recordings) and human-reviewable PRs/issues.

The MCP server is `proofdrop-mcp`. Its tools (call with the MCP prefix your client uses, e.g. `mcp__proofdrop-mcp__upload_asset`):

- **`upload_asset`** — upload a local file, get back a presigned URL.
- **`delete_asset`** — remove an object you previously uploaded.

## When to use

Use it the moment a local visual artifact needs to live in a PR description, issue comment, or agent report. Common triggers:

- A design/QA/visual skill produced before/after screenshots and you're about to write the PR body.
- You recorded a GIF or short `.mp4` of a user flow and want reviewers to watch it.
- Canary/deploy verification captured a screenshot worth attaching.
- The user says "attach", "embed", "add a screenshot/recording/video" to a PR or issue.

Do **not** use it for files GitHub can already reference (files committed in the repo), for non-proof artifacts, or for anything sensitive — uploaded URLs are **publicly reachable** until they expire.

## How to use

### 1. Upload

Call `upload_asset` with the local path:

```json
{
  "file_path": "screenshots/before.png",
  "expires_in_seconds": 604800
}
```

Parameters:

- `file_path` (required) — absolute or working-dir-relative path to the local file.
- `content_type` (optional) — MIME override; inferred from extension by default (`.png .jpg .jpeg .gif .webp .avif .svg .pdf .mp4`… note: `.mp4` is not in the default extension map, so pass `content_type: "video/mp4"` for videos).
- `key_prefix` (optional) — S3 key prefix; defaults to `agent-assets`.
- `expires_in_seconds` (optional) — URL lifetime. Default `86400` (1 day), min `60`, **max `604800` (7 days)**. Use the max for anything reviewers need for the life of a PR.

Returns `{ bucket, key, url, expiresAt }`. Keep the `key` if you might want to delete it later. Max file size is 25 MB by default — keep videos short.

### 2. Embed in markdown

Images:

```markdown
![before](PRESIGNED_URL)
```

Video / large file (GitHub renders a link, or an inline player for supported types):

```markdown
[▶ flow recording](PRESIGNED_URL)
```

Before/after pairs read best in a table:

```markdown
| Before | After |
| --- | --- |
| ![before](URL_BEFORE) | ![after](URL_AFTER) |
```

### 3. (Optional) Clean up

If an upload was a mistake or is no longer needed, call `delete_asset` with the `key` from the upload result:

```json
{ "key": "agent-assets/2026/before-a1b2c3.png" }
```

## Notes for callers

- **Presigned URLs expire.** Tell the user the `expiresAt` if the link matters long-term; for permanent docs, commit the asset to the repo instead.
- **Public exposure.** Anyone with the URL can fetch the file until it expires. Never upload secrets, internal-only screenshots, or PII.
- Upload before writing the PR/issue body so you can paste real URLs, not placeholders.
