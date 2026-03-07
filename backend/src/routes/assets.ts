import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleAssets(req: Request, path: string): Promise<Response | null> {
  // GET /api/v1/asset-types
  if (path === '/api/v1/asset-types' && req.method === 'GET') {
    try {
      const result = await db.query('SELECT * FROM asset_types ORDER BY name');
      return json(result.rows);
    } catch {
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/assets  (user's assigned assets; admin gets all)
  if (path === '/api/v1/assets' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      const query = user.role === 'admin'
        ? `SELECT a.*, at.name as type_name, at.icon_name, u.name as user_name
           FROM assets a
           LEFT JOIN asset_types at ON at.id = a.asset_type_id
           LEFT JOIN users u ON u.id = a.assigned_user_id
           ORDER BY a.created_at DESC`
        : `SELECT a.*, at.name as type_name, at.icon_name
           FROM assets a
           LEFT JOIN asset_types at ON at.id = a.asset_type_id
           WHERE a.assigned_user_id = $1
           ORDER BY a.created_at DESC`;
      const result = user.role === 'admin'
        ? await db.query(query)
        : await db.query(query, [user.id]);
      return json(result.rows);
    } catch (e: any) {
      if (e.message?.includes('Missing')) return json({ error: 'Unauthorized' }, 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/asset-requests
  if (path === '/api/v1/asset-requests' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      const query = user.role === 'admin'
        ? `SELECT ar.*, u.name as user_name FROM asset_requests ar JOIN users u ON u.id = ar.user_id ORDER BY ar.created_at DESC`
        : `SELECT * FROM asset_requests WHERE user_id = $1 ORDER BY created_at DESC`;
      const result = user.role === 'admin'
        ? await db.query(query)
        : await db.query(query, [user.id]);
      return json(result.rows);
    } catch (e: any) {
      if (e.message?.includes('Missing')) return json({ error: 'Unauthorized' }, 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  // POST /api/v1/asset-requests
  if (path === '/api/v1/asset-requests' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      const { device_name, device_model, purpose, prime_approval } = await req.json() as any;
      const result = await db.query(
        `INSERT INTO asset_requests (user_id, device_name, device_model, purpose, prime_approval)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [user.id, device_name, device_model, purpose, prime_approval],
      );
      return json(result.rows[0], 201);
    } catch (e: any) {
      if (e.message?.includes('Missing')) return json({ error: 'Unauthorized' }, 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/asset-requests/:id  (admin only)
  const reqMatch = path.match(/^\/api\/v1\/asset-requests\/([^/]+)$/);
  if (reqMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const { status } = await req.json() as { status: string };
      if (!['approved','rejected','pending'].includes(status))
        return json({ error: 'Invalid status' }, 400);
      const result = await db.query(
        'UPDATE asset_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, reqMatch[1]],
      );
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
