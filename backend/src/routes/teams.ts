import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { vString, vStringOptional, ValidationError, validationErrorResponse } from '../middleware/validate';
import { logError } from '../middleware/logger';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleTeams(req: Request, path: string): Promise<Response | null> {

  // GET /api/v1/teams — public: list teams with nested employees
  if (path === '/api/v1/teams' && req.method === 'GET') {
    try {
      const teams = await db.query(
        'SELECT id, name, description, sort_order, created_at FROM teams ORDER BY sort_order, created_at',
      );
      const employees = await db.query(
        'SELECT id, team_id, employee_id, name, designation, email, phone, dob, emergency_contact, photo_url FROM employees ORDER BY sort_order, created_at',
      );
      const byTeam: Record<string, typeof employees.rows> = {};
      for (const e of employees.rows) (byTeam[e.team_id] ??= []).push(e);
      return json(teams.rows.map(t => ({ ...t, employees: byTeam[t.id] ?? [] })));
    } catch (e) { logError('teams-list', e); return json({ error: 'Server error' }, 500); }
  }

  // POST /api/v1/teams (admin)
  if (path === '/api/v1/teams' && req.method === 'POST') {
    try {
      const user = authenticate(req); requireAdmin(user);
      const body = await req.json() as Record<string, unknown>;
      const name = vString(body.name, 'name', { max: 100 });
      const description = vStringOptional(body.description, 'description', { max: 500 });
      const r = await db.query(
        'INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING *',
        [name, description ?? null],
      );
      return json(r.rows[0], 201);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('teams-create', e); return json({ error: 'Server error' }, 500);
    }
  }

  // DELETE /api/v1/teams/:id (admin)
  const teamOnly = path.match(/^\/api\/v1\/teams\/([^/]+)$/);
  if (teamOnly && req.method === 'DELETE') {
    try {
      const user = authenticate(req); requireAdmin(user);
      await db.query('DELETE FROM teams WHERE id = $1', [teamOnly[1]]);
      return json({ ok: true });
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('teams-delete', e); return json({ error: 'Server error' }, 500);
    }
  }

  // POST /api/v1/teams/:id/employees (admin)
  const empBase = path.match(/^\/api\/v1\/teams\/([^/]+)\/employees$/);
  if (empBase && req.method === 'POST') {
    try {
      const user = authenticate(req); requireAdmin(user);
      const body = await req.json() as Record<string, unknown>;
      const name              = vString(body.name, 'name', { max: 100 });
      const employee_id       = vStringOptional(body.employee_id, 'employee_id', { max: 50 });
      const designation       = vStringOptional(body.designation, 'designation', { max: 100 });
      const email             = vStringOptional(body.email, 'email', { max: 255 });
      const phone             = vStringOptional(body.phone, 'phone', { max: 20 });
      const dob               = body.dob ? String(body.dob) : null;
      const emergency_contact = vStringOptional(body.emergency_contact, 'emergency_contact', { max: 100 });
      const r = await db.query(
        `INSERT INTO employees (team_id, employee_id, name, designation, email, phone, dob, emergency_contact)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [empBase[1], employee_id ?? null, name, designation ?? null, email ?? null, phone ?? null, dob, emergency_contact ?? null],
      );
      return json(r.rows[0], 201);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('employees-create', e); return json({ error: 'Server error' }, 500);
    }
  }

  // /api/v1/teams/:teamId/employees/:empId
  const empItem = path.match(/^\/api\/v1\/teams\/([^/]+)\/employees\/([^/]+)$/);

  // PATCH (admin)
  if (empItem && req.method === 'PATCH') {
    try {
      const user = authenticate(req); requireAdmin(user);
      const body = await req.json() as Record<string, unknown>;
      const allowed = ['employee_id','name','designation','email','phone','dob','emergency_contact','photo_url'];
      const setClauses: string[] = []; const values: unknown[] = [];
      for (const [k, v] of Object.entries(body))
        if (allowed.includes(k)) setClauses.push(`${k} = $${values.push(v)}`);
      if (!setClauses.length) return json({ error: 'No valid fields' }, 400);
      values.push(empItem[2]); values.push(empItem[1]);
      const r = await db.query(
        `UPDATE employees SET ${setClauses.join(', ')} WHERE id = $${values.length - 1} AND team_id = $${values.length} RETURNING *`,
        values,
      );
      if (!r.rows[0]) return json({ error: 'Not found' }, 404);
      return json(r.rows[0]);
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('employees-patch', e); return json({ error: 'Server error' }, 500);
    }
  }

  // DELETE (admin)
  if (empItem && req.method === 'DELETE') {
    try {
      const user = authenticate(req); requireAdmin(user);
      await db.query('DELETE FROM employees WHERE id = $1 AND team_id = $2', [empItem[2], empItem[1]]);
      return json({ ok: true });
    } catch (e: any) {
      if (e.message?.includes('Missing') || e.message?.includes('Forbidden'))
        return json({ error: e.message }, e.message.includes('Forbidden') ? 403 : 401);
      logError('employees-delete', e); return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}
