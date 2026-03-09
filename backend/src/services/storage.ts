/**
 * Object storage abstraction — S3/MinIO when configured, local filesystem fallback.
 *
 * Set these env vars to enable S3/MinIO:
 *   S3_ENDPOINT       e.g. http://minio:9000
 *   S3_ACCESS_KEY     e.g. minioadmin
 *   S3_SECRET_KEY     e.g. minioadmin123
 *   S3_BUCKET         default: officemate
 *   S3_REGION         default: us-east-1
 *   S3_PUBLIC_URL     URL prefix browsers use to load files, e.g. http://localhost/uploads
 *
 * When S3_ENDPOINT is absent, files are written to LOCAL_UPLOAD_DIR (/uploads by default)
 * and served by Nginx at /uploads/*.
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { logInfo, logWarn } from '../middleware/logger';

const S3_ENDPOINT   = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? 'minioadmin123';
const S3_BUCKET     = process.env.S3_BUCKET ?? 'officemate';
const S3_REGION     = process.env.S3_REGION ?? 'us-east-1';
// When empty, returns a root-relative URL (/uploads/...) so Nginx can proxy it
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL?.replace(/\/$/, '') ?? '';
const LOCAL_DIR     = process.env.LOCAL_UPLOAD_DIR ?? '/uploads';

const USE_S3 = !!S3_ENDPOINT;

// ── S3 signature (AWS Signature Version 4) ────────────────────
// We implement a minimal SigV4 PUT request without the full AWS SDK
// to keep the backend dependency-free.  Covers MinIO, AWS S3, R2.

async function hmac(key: Uint8Array | string, data: string): Promise<Uint8Array> {
  const enc    = new TextEncoder();
  const keyBuf = typeof key === 'string' ? enc.encode(key) : key;
  // Cast to satisfy strict bun-types BufferSource — Uint8Array is always compatible at runtime
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBuf as unknown as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data) as unknown as ArrayBuffer);
  return new Uint8Array(sig);
}

async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const enc  = new TextEncoder();
  const buf  = typeof data === 'string' ? enc.encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', buf as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function s3Upload(buffer: Uint8Array, key: string, contentType: string): Promise<string> {
  const endpoint  = S3_ENDPOINT!;
  const now       = new Date();
  const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8);
  const amzDate   = now.toISOString().replace(/[:-]|\.\d{3}/g, '');

  const url     = `${endpoint}/${S3_BUCKET}/${key}`;
  const host    = new URL(endpoint).host;
  const payload = await sha256Hex(buffer);

  const canonHeaders =
    `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payload}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonRequest  = [
    'PUT', `/${S3_BUCKET}/${key}`, '',
    canonHeaders, signedHeaders, payload,
  ].join('\n');

  const scope       = `${dateStamp}/${S3_REGION}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, await sha256Hex(canonRequest)].join('\n');

  const enc       = new TextEncoder();
  const sigKey    = await hmac(
    await hmac(await hmac(await hmac(enc.encode(`AWS4${S3_SECRET_KEY}`), dateStamp), S3_REGION), 's3'),
    'aws4_request',
  );
  const signature = toHex(await hmac(sigKey, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${scope},SignedHeaders=${signedHeaders},Signature=${signature}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type':          contentType,
      'Host':                  host,
      'X-Amz-Content-Sha256': payload,
      'X-Amz-Date':           amzDate,
      'Authorization':         authorization,
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`S3 upload failed (${res.status}): ${text}`);
  }

  // If no public URL prefix, return a root-relative path (nginx proxies /uploads/)
  return S3_PUBLIC_URL ? `${S3_PUBLIC_URL}/${key}` : `/${key}`;
}

// ── Ensure MinIO bucket exists on startup ────────────────────

export async function ensureStorageReady(): Promise<void> {
  if (!USE_S3) {
    mkdirSync(LOCAL_DIR, { recursive: true });
    logInfo('Storage: using local filesystem', { dir: LOCAL_DIR });
    return;
  }

  // HEAD bucket — create if missing
  try {
    const res = await fetch(`${S3_ENDPOINT}/${S3_BUCKET}`, { method: 'HEAD' });
    if (res.status === 404) {
      const create = await fetch(`${S3_ENDPOINT}/${S3_BUCKET}`, { method: 'PUT' });
      if (!create.ok) throw new Error(`Bucket create failed: ${create.status}`);
    }
    logInfo('Storage: MinIO/S3 ready', { endpoint: S3_ENDPOINT, bucket: S3_BUCKET });
  } catch (e) {
    logWarn('Storage: S3 bucket check failed, uploads may not work', { error: String(e) });
  }
}

// ── Public API ────────────────────────────────────────────────

/**
 * Upload a file buffer.  Returns the public URL browsers can use to load it.
 */
export async function uploadFile(
  buffer: Uint8Array,
  key:    string,
  contentType: string,
): Promise<string> {
  if (USE_S3) {
    return s3Upload(buffer, key, contentType);
  }

  // Local filesystem
  const filePath = join(LOCAL_DIR, key);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, buffer);
  return `/uploads/${key}`;
}

/**
 * Generate a unique storage key for an uploaded file.
 * Format: uploads/<userId>/<timestamp>-<random>.<ext>
 */
export function generateKey(userId: string, filename: string): string {
  const ext  = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'bin';
  const rand = Math.random().toString(36).slice(2, 8);
  return `uploads/${userId}/${Date.now()}-${rand}.${ext}`;
}

export const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
]);

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — supports large photos
