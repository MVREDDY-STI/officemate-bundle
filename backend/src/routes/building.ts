import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { broadcast } from '../ws/hub';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleBuilding(req: Request, path: string): Promise<Response | null> {
  // GET /api/v1/building-info
  if (path === '/api/v1/building-info' && req.method === 'GET') {
    try {
      const result = await db.query('SELECT * FROM building_info LIMIT 1');
      return json(result.rows[0] ?? {});
    } catch {
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/building-info  (admin)
  if (path === '/api/v1/building-info' && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const fields = await req.json() as Record<string, unknown>;
      const allowed = [
        'address','phone','email','description','hours',
        'wifi_ssid','wifi_password',
        'delivery_name','delivery_company','delivery_address',
        'emergency_name','emergency_company','emergency_address',
        'map_image_url',
      ];
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      for (const [k, v] of Object.entries(fields)) {
        if (allowed.includes(k)) { setClauses.push(`${k} = $${idx++}`); values.push(v); }
      }
      if (!setClauses.length) return json({ error: 'No valid fields' }, 400);

      // Upsert: update if exists, insert if empty table
      const existing = await db.query('SELECT id FROM building_info LIMIT 1');
      let result;
      if (existing.rows[0]) {
        result = await db.query(
          `UPDATE building_info SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
          [...values, existing.rows[0].id],
        );
      } else {
        // Build insert from fields
        const cols = Object.keys(fields).filter(k => allowed.includes(k));
        const vals = cols.map(k => fields[k]);
        const placeholders = cols.map((_, i) => `$${i + 1}`);
        result = await db.query(
          `INSERT INTO building_info (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`,
          vals,
        );
      }

      broadcast('building:updated', result.rows[0]);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
