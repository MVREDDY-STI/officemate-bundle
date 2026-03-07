import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { broadcast } from '../ws/hub';
import { vString, vEnum, ValidationError, validationErrorResponse } from '../middleware/validate';
import { logError } from '../middleware/logger';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const CONTENT_TYPES = ['text', 'image', 'html'] as const;

export async function handleContent(req: Request, path: string): Promise<Response | null> {

  // GET /api/v1/content?keys=k1,k2,...
  if (path === '/api/v1/content' && req.method === 'GET') {
    try {
      const url       = new URL(req.url);
      const keysParam = url.searchParams.get('keys');
      if (!keysParam) return json({});

      const keys = keysParam.split(',').map(k => k.trim()).filter(Boolean).slice(0, 200);
      if (!keys.length) return json({});

      const result = await db.query(
        'SELECT storage_key, content FROM content_blocks WHERE storage_key = ANY($1)',
        [keys],
      );

      const map: Record<string, string> = {};
      for (const row of result.rows) {
        map[row.storage_key] = row.content;
      }
      return json(map);
    } catch (e) {
      logError('content-list', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/content/:key
  const singleMatch = path.match(/^\/api\/v1\/content\/(.+)$/);
  if (singleMatch && req.method === 'GET') {
    const key = decodeURIComponent(singleMatch[1]);
    try {
      const result = await db.query(
        'SELECT storage_key, content, content_type FROM content_blocks WHERE storage_key = $1',
        [key],
      );
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      return json(result.rows[0]);
    } catch (e) {
      logError('content-get', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/content/:key  (admin only)
  if (singleMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);

      const key  = decodeURIComponent(singleMatch[1]);
      const body = await req.json() as Record<string, unknown>;

      const content      = vString(body.content, 'content', { max: 100_000 });
      const content_type = body.content_type !== undefined
        ? vEnum(body.content_type, 'content_type', CONTENT_TYPES)
        : 'text';

      const result = await db.query(
        `INSERT INTO content_blocks (storage_key, content, content_type, updated_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (storage_key)
         DO UPDATE SET content = $2, content_type = $3, updated_at = NOW(), updated_by = $4
         RETURNING storage_key, content, content_type, updated_at`,
        [key, content, content_type, user.id],
      );

      const row = result.rows[0];
      broadcast('content:updated', { key: row.storage_key, value: row.content });
      return json(row);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('content-patch', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
