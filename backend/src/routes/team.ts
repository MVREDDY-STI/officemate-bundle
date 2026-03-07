import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleTeam(req: Request, path: string): Promise<Response | null> {
  // GET /api/v1/team
  if (path === '/api/v1/team' && req.method === 'GET') {
    try {
      const result = await db.query(
        'SELECT * FROM team_members WHERE is_visible = TRUE ORDER BY section, sort_order',
      );
      return json(result.rows);
    } catch {
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/team/:id  (admin)
  const teamMatch = path.match(/^\/api\/v1\/team\/([^/]+)$/);
  if (teamMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const fields = await req.json() as Record<string, unknown>;
      const allowed = ['name','title','photo_url','section','sort_order','is_visible'];
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      for (const [k, v] of Object.entries(fields)) {
        if (allowed.includes(k)) { setClauses.push(`${k} = $${idx++}`); values.push(v); }
      }
      if (!setClauses.length) return json({ error: 'No valid fields' }, 400);
      values.push(teamMatch[1]);
      const result = await db.query(
        `UPDATE team_members SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
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
