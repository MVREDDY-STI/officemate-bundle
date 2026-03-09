import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleUsers(req: Request, path: string): Promise<Response | null> {
  // GET /api/v1/users  (admin)
  if (path === '/api/v1/users' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const result = await db.query(
        `SELECT id, email, name, role, avatar_url, is_approved, created_at
         FROM users ORDER BY is_approved ASC, created_at DESC`,
      );
      return json(result.rows);
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  // GET /api/v1/users/me
  if (path === '/api/v1/users/me' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      const result = await db.query(
        'SELECT id, email, name, role, avatar_url FROM users WHERE id = $1',
        [user.id],
      );
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e.message?.includes('Missing')) return json({ error: 'Unauthorized' }, 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  const userMatch = path.match(/^\/api\/v1\/users\/([^/]+)$/);

  // DELETE /api/v1/users/:id  (admin only)
  if (userMatch && req.method === 'DELETE') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const targetId = userMatch[1];

      if (user.id === targetId) return json({ error: 'Cannot delete your own account' }, 400);

      const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [targetId]);
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      return json({ ok: true });
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/users/:id  (admin or self)
  if (userMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      const targetId = userMatch[1];
      if (user.role !== 'admin' && user.id !== targetId)
        return json({ error: 'Forbidden' }, 403);

      const fields = await req.json() as Record<string, unknown>;
      const allowed = user.role === 'admin'
        ? ['name', 'avatar_url', 'role', 'is_approved']
        : ['name', 'avatar_url']; // users can't self-promote

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      for (const [k, v] of Object.entries(fields)) {
        if (allowed.includes(k)) { setClauses.push(`${k} = $${idx++}`); values.push(v); }
      }
      if (!setClauses.length) return json({ error: 'No valid fields' }, 400);
      values.push(targetId);
      const result = await db.query(
        `UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id,email,name,role,avatar_url,is_approved`,
        values,
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
