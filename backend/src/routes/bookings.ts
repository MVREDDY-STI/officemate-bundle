import db from '../db/client';
import { authenticate } from '../middleware/auth';
import { broadcast, broadcastToDevices } from '../ws/hub';
import {
  vUuid, vDate, vInt, vStringOptional,
  parsePagination, ValidationError, validationErrorResponse,
} from '../middleware/validate';
import { logError } from '../middleware/logger';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Notify TV displays that are linked to the affected room */
async function notifyDisplaysForRoom(roomId: string): Promise<void> {
  try {
    const result = await db.query(
      'SELECT id FROM tv_displays WHERE room_id = $1',
      [roomId],
    );
    if (result.rows.length > 0) {
      const displayIds = result.rows.map((r: { id: string }) => r.id);
      broadcastToDevices(displayIds, 'display:booking_updated', { room_id: roomId });
    }
  } catch { /* non-critical — don't fail the booking operation */ }
}

export async function handleBookings(req: Request, path: string): Promise<Response | null> {

  // GET /api/v1/bookings?date=YYYY-MM-DD  — all confirmed bookings for a day (availability)
  if (path === '/api/v1/bookings' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      const url  = new URL(req.url);
      const dateParam = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
      const date = vDate(dateParam, 'date');

      const result = await db.query(
        `SELECT b.id, b.room_id, r.name as room_name, b.user_id, u.name as user_name,
                b.booking_date, b.start_slot, b.end_slot, b.title, b.status
         FROM bookings b
         JOIN rooms r ON r.id = b.room_id
         JOIN users u ON u.id = b.user_id
         WHERE b.booking_date = $1 AND b.status = 'confirmed'
         ORDER BY b.room_id, b.start_slot`,
        [date],
      );
      return json(result.rows);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('bookings-list', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/bookings/mine  — current user's bookings (paginated)
  if (path === '/api/v1/bookings/mine' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      const { page, limit, offset } = parsePagination(new URL(req.url));

      const [dataRes, countRes] = await Promise.all([
        db.query(
          `SELECT b.id, b.room_id, r.name as room_name, r.color,
                  b.booking_date, b.start_slot, b.end_slot, b.title, b.status, b.created_at
           FROM bookings b
           JOIN rooms r ON r.id = b.room_id
           WHERE b.user_id = $1
           ORDER BY b.booking_date DESC, b.start_slot DESC
           LIMIT $2 OFFSET $3`,
          [user.id, limit, offset],
        ),
        db.query('SELECT COUNT(*) FROM bookings WHERE user_id = $1', [user.id]),
      ]);

      const total = Number(countRes.rows[0].count);
      return json({
        data:       dataRes.rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('bookings-mine', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // POST /api/v1/bookings
  if (path === '/api/v1/bookings' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      const body = await req.json() as Record<string, unknown>;

      const room_id    = vUuid(body.room_id, 'room_id');
      const date       = vDate(body.date, 'date');
      const start_slot = vInt(body.start_slot, 'start_slot', 0, 17);
      const end_slot   = vInt(body.end_slot,   'end_slot',   1, 18);
      const title      = vStringOptional(body.title, 'title', 120) ?? 'Meeting';

      if (end_slot <= start_slot) {
        return json({ error: 'end_slot must be greater than start_slot' }, 400);
      }
      if ((end_slot - start_slot) > 8) {
        return json({ error: 'Maximum 8 slots (4 hours) per booking' }, 400);
      }

      const result = await db.query(
        `INSERT INTO bookings (room_id, user_id, booking_date, start_slot, end_slot, title)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, room_id, user_id, booking_date, start_slot, end_slot, title, status, created_at`,
        [room_id, user.id, date, start_slot, end_slot, title],
      );

      const booking = result.rows[0];
      broadcast('booking:created', booking);
      notifyDisplaysForRoom(room_id);
      return json(booking, 201);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) return json({ error: 'Unauthorized' }, 401);
      if (e.code === '23P01') return json({ error: 'Time slot already booked' }, 409);
      logError('bookings-create', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/bookings/:id/cancel
  const cancelMatch = path.match(/^\/api\/v1\/bookings\/([^/]+)\/cancel$/);
  if (cancelMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      const id   = vUuid(cancelMatch[1], 'id');

      const result = await db.query(
        `UPDATE bookings SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1 AND (user_id = $2 OR $3 = 'admin') AND status = 'confirmed'
         RETURNING *`,
        [id, user.id, user.role],
      );
      if (!result.rows[0]) return json({ error: 'Not found or already cancelled' }, 404);
      broadcast('booking:cancelled', { bookingId: id });
      notifyDisplaysForRoom(result.rows[0].room_id);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('bookings-cancel', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
