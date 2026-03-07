import { authenticate }                        from '../middleware/auth';
import { uploadFile, generateKey, ALLOWED_MIME, MAX_FILE_SIZE } from '../services/storage';
import { logError }                             from '../middleware/logger';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleUploads(req: Request, path: string): Promise<Response | null> {

  // POST /api/v1/uploads  — multipart/form-data, field: "file"
  if (path === '/api/v1/uploads' && req.method === 'POST') {
    try {
      const user = authenticate(req);

      const formData = await req.formData();
      const file = formData.get('file');

      if (!(file instanceof File)) {
        return json({ error: 'field "file" is required (multipart/form-data)' }, 400);
      }

      // ── Validate type ───────────────────────────────────
      if (!ALLOWED_MIME.has(file.type)) {
        return json({
          error: `Unsupported file type. Allowed: ${[...ALLOWED_MIME].join(', ')}`,
        }, 415);
      }

      // ── Validate size ───────────────────────────────────
      if (file.size > MAX_FILE_SIZE) {
        return json({ error: `File too large. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)} MB` }, 413);
      }

      // ── Upload ──────────────────────────────────────────
      const key    = generateKey(user.id, file.name);
      const buffer = new Uint8Array(await file.arrayBuffer());
      const url    = await uploadFile(buffer, key, file.type);

      return json({ url, key, size: file.size, type: file.type }, 201);

    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) {
        return json({ error: 'Unauthorized' }, 401);
      }
      logError('uploads', e);
      return json({ error: 'Upload failed' }, 500);
    }
  }

  return null;
}
