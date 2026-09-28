import "server-only";
import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { AwsClient } from "aws4fetch";

/**
 * File uploads for the admin panel.
 * - If S3_* env vars are set, uploads go to any S3-compatible bucket (AWS S3, Cloudflare R2, DigitalOcean Spaces).
 * - Otherwise files are written to UPLOAD_DIR (default ./uploads) and served by the /uploads/[...path] route.
 */

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

export function uploadDir() {
  // Runtime upload folder, not a build input — excluded from output file tracing.
  return path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "uploads"));
}

function s3Enabled() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

export async function saveUpload(file: File, folder = "misc"): Promise<string> {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Unsupported file type. Use JPG, PNG, WEBP, AVIF, GIF, MP4 or WEBM.");
  const limit = file.type.startsWith("video/") ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) throw new Error(`File is too large (max ${Math.round(limit / 1024 / 1024)} MB).`);

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").slice(0, 30) || "misc";
  const now = new Date();
  const key = `${safeFolder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (s3Enabled()) {
    const client = new AwsClient({
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      region: process.env.S3_REGION || "auto",
      service: "s3",
    });
    const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, "");
    const res = await client.fetch(`${endpoint}/${process.env.S3_BUCKET}/${key}`, {
      method: "PUT",
      body: bytes,
      headers: { "Content-Type": file.type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const publicBase = (process.env.S3_PUBLIC_URL || `${endpoint}/${process.env.S3_BUCKET}`).replace(/\/$/, "");
    return `${publicBase}/${key}`;
  }

  const target = path.join(uploadDir(), key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return `/uploads/${key}`;
}

export const UPLOAD_CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED).map(([type, ext]) => [ext, type]),
);
