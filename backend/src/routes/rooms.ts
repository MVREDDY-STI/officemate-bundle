import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { broadcast } from '../ws/hub';
import {
  vString, vStringOptional, vInt, vUuid,
  ValidationError, validationErrorResponse,
} from '../middleware/validate';
import { logError } from '../middleware/logger';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleRooms(req: Request, path: string): Promise<Response | null> {

  // GET /api/v1/rooms  — public
  if (path === '/api/v1/rooms' && req.method === 'GET') {
    try {
      const result = await db.query(
        'SELECT id, name, room_code, capacity, features, image_url, color, is_active, sort_order FROM rooms WHERE is_active = TRUE ORDER BY sort_order',
      );
      return json(result.rows);
    } catch (e) {
      logError('rooms-list', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // POST /api/v1/rooms  (admin)
  if (path === '/api/v1/rooms' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const body = await req.json() as Record<string, unknown>;

      const name       = vString(body.name, 'name', { max: 100 });
      const room_code  = vString(body.room_code, 'room_code', { max: 20 });
      const capacity   = body.capacity   !== undefined ? vInt(body.capacity,   'capacity',   1, 200) : 4;
      const sort_order = body.sort_order !== undefined ? vInt(body.sort_order, 'sort_order', 0, 999) : 0;
      const image_url  = vStringOptional(body.image_url, 'image_url', 500);
      const color      = vStringOptional(body.color, 'color', 20) ?? '#f59e3d';
      const features   = Array.isArray(body.features) ? body.features.map(String).slice(0, 20) : [];

      const result = await db.query(
        `INSERT INTO rooms (name, room_code, capacity, features, image_url, color, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [name, room_code, capacity, features, image_url, color, sort_order],
      );
      const room = result.rows[0];
      broadcast('room:updated', room);
      return json(room, 201);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      if (e.message?.includes('expired') || e.message?.includes('invalid') || e.message?.includes('jwt') || e.message?.includes('Unauthorized'))
        return json({ error: 'Session expired — please log in again' }, 401);
      if (e.code === '23505') return json({ error: 'Room name or code already exists' }, 409);
      logError('rooms-create', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  const roomMatch = path.match(/^\/api\/v1\/rooms\/([^/]+)$/);

  // PATCH /api/v1/rooms/:id  (admin)
  if (roomMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const id   = vUuid(roomMatch[1], 'id');
      const body = await req.json() as Record<string, unknown>;

      const setClauses: string[] = [];
      const values: unknown[]    = [];

      if (body.name       !== undefined) setClauses.push(`name       = $${values.push(vString(body.name, 'name', { max: 100 }))}`);
      if (body.room_code  !== undefined) setClauses.push(`room_code  = $${values.push(vString(body.room_code, 'room_code', { max: 20 }))}`);
      if (body.capacity   !== undefined) setClauses.push(`capacity   = $${values.push(vInt(body.capacity, 'capacity', 1, 200))}`);
      if (body.sort_order !== undefined) setClauses.push(`sort_order = $${values.push(vInt(body.sort_order, 'sort_order', 0, 999))}`);
      if (body.image_url  !== undefined) setClauses.push(`image_url  = $${values.push(vStringOptional(body.image_url, 'image_url', 500))}`);
      if (body.color      !== undefined) setClauses.push(`color      = $${values.push(vStringOptional(body.color, 'color', 20) ?? '#f59e3d')}`);
      if (body.is_active  !== undefined) setClauses.push(`is_active  = $${values.push(!!body.is_active)}`);
      if (body.features   !== undefined) setClauses.push(`features   = $${values.push(Array.isArray(body.features) ? body.features.map(String).slice(0, 20) : [])}`);

      if (!setClauses.length) return json({ error: 'No valid fields to update' }, 400);
      values.push(id);

      const result = await db.query(
        `UPDATE rooms SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values,
      );
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      broadcast('room:updated', result.rows[0]);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('rooms-update', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // DELETE /api/v1/rooms/:id  (admin — soft delete)
  if (roomMatch && req.method === 'DELETE') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const id = vUuid(roomMatch[1], 'id');
      await db.query('UPDATE rooms SET is_active = FALSE WHERE id = $1', [id]);
      return json({ ok: true });
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('rooms-delete', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
