import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { broadcastToAllDevices, broadcastToDevice, getOnlineDisplayIds } from '../ws/hub';
import {
  vString, vStringOptional, vUuid,
  ValidationError, validationErrorResponse,
} from '../middleware/validate';
import { logError } from '../middleware/logger';
import { randomBytes } from 'crypto';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Generate a 6-char alphanumeric pairing code */
function genPairingCode(): string {
  return randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

/** Generate a secure device token (32 random bytes hex) */
function genDeviceToken(): string {
  return randomBytes(32).toString('hex');
}

/** Authenticate a TV device via X-Device-Token header */
async function authenticateDevice(req: Request): Promise<{ displayId: string; deviceId: string }> {
  const token = req.headers.get('X-Device-Token');
  if (!token) throw new Error('Missing X-Device-Token header');
  const result = await db.query(
    'SELECT id, device_id FROM tv_displays WHERE device_token = $1',
    [token],
  );
  if (!result.rows[0]) throw new Error('Invalid device token');
  return { displayId: result.rows[0].id, deviceId: result.rows[0].device_id };
}

/** Mark display as seen and online */
async function touchDisplay(displayId: string): Promise<void> {
  await db.query(
    'UPDATE tv_displays SET last_seen_at = NOW(), is_online = TRUE WHERE id = $1',
    [displayId],
  );
}

export async function handleDisplays(req: Request, path: string): Promise<Response | null> {

  // POST /api/v1/displays/pair-code  — Admin: generate pairing code
  if (path === '/api/v1/displays/pair-code' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      requireAdmin(user);

      const body = await req.json() as Record<string, unknown>;
      const name = vStringOptional(body.name, 'name', 100) ?? 'TV Display';

      const code = genPairingCode();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Create a pending display entry (no device_id yet — assigned on register)
      // Use the pairing code as a temporary device_id placeholder
      const result = await db.query(
        `INSERT INTO tv_displays (name, device_id, pairing_code, pairing_expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, pairing_code, pairing_expires_at`,
        [name, `pending:${code}`, code, expires],
      );
      return json(result.rows[0], 201);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('displays-pair-code', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // POST /api/v1/displays/register  — TV app: pair using code, get device_token
  if (path === '/api/v1/displays/register' && req.method === 'POST') {
    try {
      const body = await req.json() as Record<string, unknown>;
      const pairingCode = vString(body.pairing_code, 'pairing_code', { min: 6, max: 6 });
      const deviceId    = vString(body.device_id, 'device_id', { max: 200 });

      const row = await db.query(
        `SELECT id, name, pairing_code, pairing_expires_at, device_token
         FROM tv_displays
         WHERE pairing_code = $1`,
        [pairingCode],
      );

      if (!row.rows[0]) return json({ error: 'Invalid pairing code' }, 400);
      const display = row.rows[0];

      if (display.device_token) return json({ error: 'Pairing code already used' }, 400);
      if (new Date(display.pairing_expires_at) < new Date()) {
        return json({ error: 'Pairing code expired' }, 400);
      }

      const token = genDeviceToken();
      const updated = await db.query(
        `UPDATE tv_displays
         SET device_token = $1, device_id = $2, pairing_code = NULL, pairing_expires_at = NULL,
             last_seen_at = NOW(), is_online = TRUE
         WHERE id = $3
         RETURNING id, name, room_id`,
        [token, deviceId, display.id],
      );

      // Fetch linked room name if any
      const d = updated.rows[0];
      let roomName: string | null = null;
      if (d.room_id) {
        const rr = await db.query('SELECT name FROM rooms WHERE id = $1', [d.room_id]);
        roomName = rr.rows[0]?.name ?? null;
      }

      return json({
        device_token: token,
        display_id:   d.id,
        display_name: d.name,
        room_id:      d.room_id,
        room_name:    roomName,
      }, 200);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      logError('displays-register', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/displays  — Admin: list displays
  if (path === '/api/v1/displays' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      requireAdmin(user);

      const onlineIds = new Set(getOnlineDisplayIds());
      const result = await db.query(
        `SELECT d.id, d.name, d.device_id, d.room_id, r.name AS room_name,
                d.last_seen_at, d.created_at, d.is_online
         FROM tv_displays d
         LEFT JOIN rooms r ON r.id = d.room_id
         WHERE d.device_token IS NOT NULL
         ORDER BY d.created_at DESC`,
      );

      // Hybrid online status:
      //   1. WS hub   — real-time (device has an active WS connection right now)
      //   2. Fallback — last_seen_at within 90 seconds. The device pings every 30s
      //      so this covers the brief window while WS is reconnecting after a restart.
      const ninetySecAgo = new Date(Date.now() - 90 * 1000);
      const rows = result.rows.map(row => ({
        ...row,
        is_online: onlineIds.has(row.id) ||
          (row.last_seen_at != null && new Date(row.last_seen_at) > ninetySecAgo),
      }));
      return json(rows);
    } catch (e: any) {
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('displays-list', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/displays/me  — Device: get own config
  if (path === '/api/v1/displays/me' && req.method === 'GET') {
    try {
      const { displayId } = await authenticateDevice(req);
      await touchDisplay(displayId);

      const result = await db.query(
        `SELECT d.id, d.name, d.device_id, d.room_id, r.name AS room_name, r.room_code
         FROM tv_displays d
         LEFT JOIN rooms r ON r.id = d.room_id
         WHERE d.id = $1`,
        [displayId],
      );
      return json(result.rows[0] ?? {});
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('displays-me', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/displays/me/slides  — Device: get applicable slides
  if (path === '/api/v1/displays/me/slides' && req.method === 'GET') {
    try {
      const { displayId } = await authenticateDevice(req);
      await touchDisplay(displayId);

      // Return active, non-expired, scheduled slides for this display
      const result = await db.query(
        `SELECT s.id, s.title, s.slide_type, s.content, s.duration_seconds, s.sort_order
         FROM display_slides s
         WHERE s.is_active = TRUE
           AND (s.starts_at IS NULL OR s.starts_at <= NOW())
           AND (s.ends_at   IS NULL OR s.ends_at   >  NOW())
           AND (
             s.target = 'all'
             OR (s.target = 'specific' AND EXISTS (
               SELECT 1 FROM display_slide_targets t
               WHERE t.slide_id = s.id AND t.display_id = $1
             ))
           )
         ORDER BY s.sort_order, s.created_at`,
        [displayId],
      );
      return json(result.rows);
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('displays-me-slides', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/displays/me/bookings?date=YYYY-MM-DD  — Device: get room bookings
  if (path === '/api/v1/displays/me/bookings' && req.method === 'GET') {
    try {
      const { displayId } = await authenticateDevice(req);
      await touchDisplay(displayId);

      // Get the linked room_id
      const displayRow = await db.query(
        'SELECT room_id FROM tv_displays WHERE id = $1',
        [displayId],
      );
      const roomId    = displayRow.rows[0]?.room_id;
      const url       = new URL(req.url);
      const dateParam = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

      if (roomId) {
        // Display linked to a specific room — return that room's bookings only
        const result = await db.query(
          `SELECT b.id, b.room_id, r.name AS room_name, b.user_id, u.name AS user_name,
                  b.booking_date, b.start_slot, b.end_slot, b.title, b.status
           FROM bookings b
           JOIN rooms r ON r.id = b.room_id
           JOIN users u ON u.id = b.user_id
           WHERE b.room_id = $1 AND b.booking_date = $2 AND b.status = 'confirmed'
           ORDER BY b.start_slot`,
          [roomId, dateParam],
        );
        return json(result.rows);
      } else {
        // Not linked to any room — return all confirmed bookings for today across all rooms
        const result = await db.query(
          `SELECT b.id, b.room_id, r.name AS room_name, b.user_id, u.name AS user_name,
                  b.booking_date, b.start_slot, b.end_slot, b.title, b.status
           FROM bookings b
           JOIN rooms r ON r.id = b.room_id
           JOIN users u ON u.id = b.user_id
           WHERE b.booking_date = $1 AND b.status = 'confirmed'
           ORDER BY b.room_id, b.start_slot`,
          [dateParam],
        );
        return json(result.rows);
      }
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Invalid')) return json({ error: 'Unauthorized' }, 401);
      logError('displays-me-bookings', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/displays/theme  — Public: get current sidebar theme color
  if (path === '/api/v1/displays/theme' && req.method === 'GET') {
    try {
      const result = await db.query(
        "SELECT content AS color FROM content_blocks WHERE storage_key = 'tv:theme_color'",
      );
      return json({ color: result.rows[0]?.color ?? null });
    } catch (e) {
      logError('displays-theme-get', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/displays/theme  — Admin: set sidebar theme color
  if (path === '/api/v1/displays/theme' && req.method === 'PATCH') {
    try {
      const user  = authenticate(req);
      requireAdmin(user);
      const body  = await req.json() as Record<string, unknown>;
      const color = vString(body.color, 'color', { min: 4, max: 20 });
      if (!/^#[0-9a-fA-F]{3,8}$/.test(color)) {
        return json({ error: 'color must be a valid hex color (e.g. #290D68)' }, 422);
      }
      await db.query(
        `INSERT INTO content_blocks (storage_key, content, content_type, updated_by)
         VALUES ('tv:theme_color', $1, 'text', $2)
         ON CONFLICT (storage_key) DO UPDATE
           SET content    = EXCLUDED.content,
               updated_by = EXCLUDED.updated_by,
               updated_at = NOW()`,
        [color, user.id],
      );
      broadcastToAllDevices('display:theme_updated', { color });
      return json({ color });
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('displays-theme-patch', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/displays/:id  — Admin: update display
  const displayMatch = path.match(/^\/api\/v1\/displays\/([^/]+)$/);
  if (displayMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const id   = vUuid(displayMatch[1], 'id');
      const body = await req.json() as Record<string, unknown>;

      const setClauses: string[] = [];
      const values: unknown[]    = [];

      if (body.name !== undefined) {
        setClauses.push(`name = $${values.push(vString(body.name, 'name', { max: 100 }))}`);
      }
      if ('room_id' in body) {
        const rid = body.room_id ? vUuid(body.room_id, 'room_id') : null;
        setClauses.push(`room_id = $${values.push(rid)}`);
      }

      if (!setClauses.length) return json({ error: 'No valid fields to update' }, 400);
      values.push(id);

      const result = await db.query(
        `UPDATE tv_displays SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id, name, room_id`,
        values,
      );
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);

      // Notify the device of its config change
      broadcastToDevice(id, 'display:config_updated', result.rows[0]);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('displays-update', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // DELETE /api/v1/displays/:id  — Admin: remove display
  if (displayMatch && req.method === 'DELETE') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const id = vUuid(displayMatch[1], 'id');

      await db.query('DELETE FROM tv_displays WHERE id = $1', [id]);
      return json({ ok: true });
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('displays-delete', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
