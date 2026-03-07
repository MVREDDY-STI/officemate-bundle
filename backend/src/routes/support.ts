import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleSupport(req: Request, path: string): Promise<Response | null> {
  // GET /api/v1/support
  if (path === '/api/v1/support' && req.method === 'GET') {
    try {
      const cats = await db.query(
        'SELECT id, title, icon_name, sort_order FROM support_categories ORDER BY sort_order',
      );
      const items = await db.query(
        'SELECT id, category_id, label, sort_order FROM support_items ORDER BY sort_order',
      );
      const result = cats.rows.map(cat => ({
        ...cat,
        items: items.rows.filter(i => i.category_id === cat.id),
      }));
      return json(result);
    } catch {
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/support/categories/:id  (admin)
  const catMatch = path.match(/^\/api\/v1\/support\/categories\/([^/]+)$/);
  if (catMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const { title, icon_name } = await req.json() as any;
      const result = await db.query(
        'UPDATE support_categories SET title = COALESCE($1,title), icon_name = COALESCE($2,icon_name) WHERE id = $3 RETURNING *',
        [title, icon_name, catMatch[1]],
      );
      if (!result.rows[0]) return json({ error: 'Not found' }, 404);
      return json(result.rows[0]);
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      return json({ error: 'Server error' }, 500);
    }
  }

  // PATCH /api/v1/support/items/:id  (admin)
  const itemMatch = path.match(/^\/api\/v1\/support\/items\/([^/]+)$/);
  if (itemMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const { label } = await req.json() as any;
      const result = await db.query(
        'UPDATE support_items SET label = COALESCE($1,label) WHERE id = $2 RETURNING *',
        [label, itemMatch[1]],
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
