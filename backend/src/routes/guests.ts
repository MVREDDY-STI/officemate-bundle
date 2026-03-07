import db from '../db/client';
import { authenticate } from '../middleware/auth';
import { broadcast } from '../ws/hub';
import {
  vString, vStringOptional, vDate, vUuid, vEnum,
  parsePagination, ValidationError, validationErrorResponse,
} from '../middleware/validate';
import { logError } from '../middleware/logger';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const GUEST_STATUSES = ['pending', 'checked_in', 'cancelled'] as const;

export async function handleGuests(req: Request, path: string): Promise<Response | null> {

  // GET /api/v1/guests  — paginated
  if (path === '/api/v1/guests' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      const { page, limit, offset } = parsePagination(new URL(req.url));

      const isAdmin = user.role === 'admin';
      const [dataRes, countRes] = await Promise.all([
        db.query(
          isAdmin
            ? `SELECT * FROM guests ORDER BY visit_date DESC, created_at DESC LIMIT $1 OFFSET $2`
            : `SELECT * FROM guests WHERE host_user_id = $3 ORDER BY visit_date DESC, created_at DESC LIMIT $1 OFFSET $2`,
          isAdmin ? [limit, offset] : [limit, offset, user.id],
        ),
        db.query(
          isAdmin
            ? `SELECT COUNT(*) FROM guests`
            : `SELECT COUNT(*) FROM guests WHERE host_user_id = $1`,
          isAdmin ? [] : [user.id],
        ),
      ]);

      const total = Number(countRes.rows[0].count);
      return json({
        data:       dataRes.rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('guests-list', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // POST /api/v1/guests
  if (path === '/api/v1/guests' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      const body = await req.json() as Record<string, unknown>;

      const first_name = vString(body.first_name, 'first_name', { max: 100 });
      const last_name  = vStringOptional(body.last_name,  'last_name',  100);
      const email      = vStringOptional(body.email,      'email',      255);
      const visit_date = body.visit_date ? vDate(body.visit_date, 'visit_date') : undefined;
      const visit_time = vStringOptional(body.visit_time, 'visit_time', 20);

      const result = await db.query(
        `INSERT INTO guests (host_user_id, first_name, last_name, email, visit_date, visit_time)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [user.id, first_name, last_name, email, visit_date, visit_time],
      );
      const guest = result.rows[0];
      broadcast('guest:created', guest);
      return json(guest, 201);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('guests-create', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  const guestMatch = path.match(/^\/api\/v1\/guests\/([^/]+)$/);

  // PATCH /api/v1/guests/:id
  if (guestMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      const id   = vUuid(guestMatch[1], 'id');
      const body = await req.json() as Record<string, unknown>;

      // Build SET clause dynamically — only validated fields
      const setClauses: string[] = [];
      const values: unknown[]    = [];

      if (body.first_name !== undefined) setClauses.push(`first_name = $${values.push(vString(body.first_name, 'first_name', { max: 100 }))}`);
      if (body.last_name  !== undefined) setClauses.push(`last_name  = $${values.push(vStringOptional(body.last_name,  'last_name',  100))}`);
      if (body.email      !== undefined) setClauses.push(`email      = $${values.push(vStringOptional(body.email,      'email',      255))}`);
      if (body.visit_date !== undefined) setClauses.push(`visit_date = $${values.push(body.visit_date ? vDate(body.visit_date, 'visit_date') : null)}`);
      if (body.visit_time !== undefined) setClauses.push(`visit_time = $${values.push(vStringOptional(body.visit_time, 'visit_time', 20))}`);
      if (body.status     !== undefined) setClauses.push(`status     = $${values.push(vEnum(body.status, 'status', GUEST_STATUSES))}`);

      if (!setClauses.length) return json({ error: 'No valid fields to update' }, 400);

      // Non-admin may only edit their own guests
      const idIdx = values.push(id);
      const ownerFilter = user.role === 'admin'
        ? `WHERE id = $${idIdx}`
        : `WHERE id = $${idIdx} AND host_user_id = $${values.push(user.id)}`;

      const result = await db.query(
        `UPDATE guests SET ${setClauses.join(', ')}, updated_at = NOW() ${ownerFilter} RETURNING *`,
        values,
      );
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('guests-update', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // DELETE /api/v1/guests/:id
  if (guestMatch && req.method === 'DELETE') {
    try {
      const user = authenticate(req);
      const id   = vUuid(guestMatch[1], 'id');

      const whereClause = user.role === 'admin' ? 'WHERE id = $1' : 'WHERE id = $1 AND host_user_id = $2';
      const params      = user.role === 'admin' ? [id] : [id, user.id];
      const result = await db.query(`DELETE FROM guests ${whereClause} RETURNING id`, params);
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      return json({ ok: true });
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('guests-delete', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
