import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { broadcast } from '../ws/hub';
import {
  vString, vStringOptional, vDate, vUuid, vInt,
  ValidationError, validationErrorResponse,
} from '../middleware/validate';
import { logError } from '../middleware/logger';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleEvents(req: Request, path: string): Promise<Response | null> {

  // GET /api/v1/events
  // ?all=true (admin only) → all published events including past
  // default              → upcoming only (event_date >= today) for everyone
  if (path === '/api/v1/events' && req.method === 'GET') {
    try {
      const url     = new URL(req.url);
      const showAll = url.searchParams.get('all') === 'true';

      if (showAll) {
        // Admin only — verify token
        const user = authenticate(req);
        requireAdmin(user);
        const result = await db.query(
          `SELECT id, title, description, image_url, event_date, event_time, is_published, sort_order, created_at, updated_at
           FROM events WHERE is_published = TRUE ORDER BY event_date DESC, sort_order`,
        );
        return json(result.rows);
      }

      // Public: upcoming events only
      const result = await db.query(
        `SELECT id, title, description, image_url, event_date, event_time, is_published, sort_order, created_at, updated_at
         FROM events
         WHERE is_published = TRUE AND (event_date IS NULL OR event_date >= CURRENT_DATE)
         ORDER BY event_date ASC NULLS LAST, sort_order`,
      );
      return json(result.rows);
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden') || e.message?.includes('Unauthorized'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('events-list', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // POST /api/v1/events  (admin)
  if (path === '/api/v1/events' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const body = await req.json() as Record<string, unknown>;

      const title        = vString(body.title, 'title', { max: 200 });
      const description  = vStringOptional(body.description, 'description', 2000);
      const image_url    = vStringOptional(body.image_url, 'image_url', 500);
      const event_date   = body.event_date ? vDate(body.event_date, 'event_date') : null;
      const event_time   = body.event_time  ? String(body.event_time).slice(0, 10)  : null;
      const is_published = typeof body.is_published === 'boolean' ? body.is_published : true;
      const sort_order   = body.sort_order !== undefined ? vInt(body.sort_order, 'sort_order', 0, 9999) : 0;

      const result = await db.query(
        `INSERT INTO events (title, description, image_url, event_date, event_time, is_published, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [title, description, image_url, event_date, event_time, is_published, sort_order],
      );
      const event = result.rows[0];
      broadcast('event:updated', event);
      return json(event, 201);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden') || e.message?.includes('Unauthorized'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('events-create', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  const eventMatch = path.match(/^\/api\/v1\/events\/([^/]+)$/);

  // PATCH /api/v1/events/:id  (admin)
  if (eventMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const id   = vUuid(eventMatch[1], 'id');
      const body = await req.json() as Record<string, unknown>;

      const setClauses: string[] = [];
      const values: unknown[]    = [];

      if (body.title        !== undefined) setClauses.push(`title        = $${values.push(vString(body.title, 'title', { max: 200 }))}`);
      if (body.description  !== undefined) setClauses.push(`description  = $${values.push(vStringOptional(body.description, 'description', 2000))}`);
      if (body.image_url    !== undefined) setClauses.push(`image_url    = $${values.push(vStringOptional(body.image_url, 'image_url', 500))}`);
      if (body.event_date   !== undefined) setClauses.push(`event_date   = $${values.push(body.event_date ? vDate(body.event_date, 'event_date') : null)}`);
      if (body.event_time   !== undefined) setClauses.push(`event_time   = $${values.push(body.event_time ? String(body.event_time).slice(0, 10) : null)}`);
      if (body.is_published !== undefined) setClauses.push(`is_published = $${values.push(!!body.is_published)}`);
      if (body.sort_order   !== undefined) setClauses.push(`sort_order   = $${values.push(vInt(body.sort_order, 'sort_order', 0, 9999))}`);

      if (!setClauses.length) return json({ error: 'No valid fields to update' }, 400);
      values.push(id);

      const result = await db.query(
        `UPDATE events SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values,
      );
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      broadcast('event:updated', result.rows[0]);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden') || e.message?.includes('Unauthorized'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('events-update', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // DELETE /api/v1/events/:id  (admin) — hard delete; past events kept by not deleting them
  if (eventMatch && req.method === 'DELETE') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const id = vUuid(eventMatch[1], 'id');
      await db.query('DELETE FROM events WHERE id = $1', [id]);
      return json({ ok: true });
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden') || e.message?.includes('Unauthorized'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('events-delete', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
