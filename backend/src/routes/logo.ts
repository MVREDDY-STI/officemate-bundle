import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { broadcastToAllDevices } from '../ws/hub';
import { vString, ValidationError, validationErrorResponse } from '../middleware/validate';
import { logError } from '../middleware/logger';

const LOGO_KEY = 'tv:logo';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleLogo(req: Request, path: string): Promise<Response | null> {

  // GET /api/v1/logo  — Public: get current TV logo URL
  if (path === '/api/v1/logo' && req.method === 'GET') {
    try {
      const result = await db.query(
        'SELECT content AS url FROM content_blocks WHERE storage_key = $1',
        [LOGO_KEY],
      );
      return json({ url: result.rows[0]?.url ?? null });
    } catch (e) {
      logError('logo-get', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/logo  — Admin: set TV logo URL
  if (path === '/api/v1/logo' && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const body = await req.json() as Record<string, unknown>;
      const url  = vString(body.url, 'url', { max: 500 });

      await db.query(
        `INSERT INTO content_blocks (storage_key, content, content_type, updated_by)
         VALUES ($1, $2, 'image', $3)
         ON CONFLICT (storage_key) DO UPDATE
           SET content    = EXCLUDED.content,
               updated_by = EXCLUDED.updated_by,
               updated_at = NOW()`,
        [LOGO_KEY, url, user.id],
      );

      broadcastToAllDevices('display:logo_updated', { url });
      return json({ url });
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('logo-update', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
