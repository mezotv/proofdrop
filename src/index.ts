#!/usr/bin/env node

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { stat, readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

type UploadedAsset = {
  bucket: string;
  key: string;
  url: string;
  expiresAt: string;
  contentType: string;
  sizeBytes: number;
};

const DEFAULT_URL_TTL_SECONDS = Number(process.env.ASSET_URL_TTL_SECONDS ?? 86_400);
const MAX_URL_TTL_SECONDS = 604_800;
const MAX_ASSET_BYTES = Number(process.env.MAX_ASSET_BYTES ?? 25 * 1024 * 1024);
const DEFAULT_KEY_PREFIX = process.env.ASSET_KEY_PREFIX ?? "agent-assets";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function bucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME ?? process.env.S3_BUCKET_NAME ?? process.env.AWS_BUCKET_NAME;

  if (!bucket) {
    throw new Error("Missing required environment variable: AWS_S3_BUCKET_NAME");
  }

  return bucket;
}

function s3Client(): S3Client {
  return new S3Client({
    endpoint: requiredEnv("AWS_ENDPOINT_URL_S3"),
    region: process.env.AWS_REGION || "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
}

function jsonResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResponse(error: unknown) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: error instanceof Error ? error.message : String(error),
      },
    ],
  };
}

function clampTtl(seconds: number | undefined): number {
  const ttl = seconds ?? DEFAULT_URL_TTL_SECONDS;

  if (!Number.isFinite(ttl)) {
    throw new Error("expires_in_seconds must be a finite number");
  }

  return Math.max(60, Math.min(Math.floor(ttl), MAX_URL_TTL_SECONDS));
}

function sanitizePathPart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._/-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, ".");
}

function inferContentType(path: string): string {
  const extension = extname(path).toLowerCase();

  switch (extension) {
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".json":
      return "application/json";
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".txt":
      return "text/plain";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function assetKey(filePath: string, keyPrefix?: string): string {
  const prefix = sanitizePathPart(keyPrefix ?? DEFAULT_KEY_PREFIX) || "agent-assets";
  const date = new Date().toISOString().slice(0, 10);
  const fileName = sanitizePathPart(basename(filePath)) || "asset";

  return `${prefix}/${date}/${randomUUID()}-${fileName}`;
}

async function uploadAsset(input: {
  file_path: string;
  content_type?: string;
  key_prefix?: string;
  expires_in_seconds?: number;
}): Promise<UploadedAsset> {
  const fileStat = await stat(input.file_path);

  if (!fileStat.isFile()) {
    throw new Error(`Not a regular file: ${input.file_path}`);
  }

  if (fileStat.size > MAX_ASSET_BYTES) {
    throw new Error(`File is ${fileStat.size} bytes, which exceeds MAX_ASSET_BYTES=${MAX_ASSET_BYTES}`);
  }

  const bucket = bucketName();
  const key = assetKey(input.file_path, input.key_prefix);
  const contentType = input.content_type ?? inferContentType(input.file_path);
  const body = await readFile(input.file_path);
  const client = s3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentLength: fileStat.size,
      ContentType: contentType,
    }),
  );

  const ttl = clampTtl(input.expires_in_seconds);
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: ttl,
  });

  return {
    bucket,
    key,
    url,
    expiresAt,
    contentType,
    sizeBytes: fileStat.size,
  };
}

async function callTool<T>(handler: () => Promise<T>) {
  try {
    return jsonResponse(await handler());
  } catch (error) {
    return errorResponse(error);
  }
}

const server = new McpServer({
  name: "cdn-mcp",
  version: "0.1.0",
});

server.registerTool(
  "upload_asset",
  {
    title: "Upload Temporary Asset",
    description:
      "Upload a local file to Neon S3-compatible storage and return a temporary presigned URL suitable for PR descriptions, issue comments, and agent reports.",
    inputSchema: {
      file_path: z.string().min(1).describe("Absolute or working-directory-relative path to the local file to upload."),
      content_type: z.string().min(1).optional().describe("Optional MIME type override. Inferred from the file extension by default."),
      key_prefix: z
        .string()
        .min(1)
        .optional()
        .describe("Optional S3 key prefix. Defaults to ASSET_KEY_PREFIX or 'agent-assets'."),
      expires_in_seconds: z
        .number()
        .int()
        .min(60)
        .max(MAX_URL_TTL_SECONDS)
        .optional()
        .describe("Temporary URL lifetime in seconds. Defaults to ASSET_URL_TTL_SECONDS or 86400. Max is 604800."),
    },
  },
  async (input: { file_path: string; content_type?: string; key_prefix?: string; expires_in_seconds?: number }) =>
    callTool(() => uploadAsset(input)),
);

server.registerTool(
  "delete_asset",
  {
    title: "Delete Uploaded Asset",
    description: "Delete an object previously uploaded by this MCP server.",
    inputSchema: {
      key: z.string().min(1).describe("S3 object key returned by upload_asset."),
    },
  },
  async ({ key }: { key: string }) =>
    callTool(async () => {
      const bucket = bucketName();
      await s3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

      return { bucket, key, deleted: true };
    }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
