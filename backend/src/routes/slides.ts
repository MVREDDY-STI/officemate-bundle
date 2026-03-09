import db from '../db/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { broadcastToAllDevices, broadcastToDevices } from '../ws/hub';
import {
  vString, vStringOptional, vInt, vUuid, vEnum,
  ValidationError, validationErrorResponse,
} from '../middleware/validate';
import { logError } from '../middleware/logger';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SLIDE_TYPES = ['text', 'quote_avatar', 'image', 'birthday'] as const;

export async function handleSlides(req: Request, path: string): Promise<Response | null> {

  // GET /api/v1/slides  — Admin: list all slides with their targets
  if (path === '/api/v1/slides' && req.method === 'GET') {
    try {
      const user = authenticate(req);
      requireAdmin(user);

      const now = new Date().toISOString();
      const slidesRes = await db.query(
        `SELECT id, title, slide_type, content, duration_seconds, sort_order,
                target, is_active, starts_at, ends_at, created_at, updated_at
         FROM display_slides ORDER BY sort_order, created_at`,
      );

      const slides = slidesRes.rows.map(s => ({
        ...s,
        is_expired:   s.ends_at   ? new Date(s.ends_at)   < new Date(now) : false,
        is_scheduled: s.starts_at ? new Date(s.starts_at) > new Date(now) : false,
      }));

      // Fetch targets for 'specific' slides
      if (slides.length > 0) {
        const specificIds = slides.filter(s => s.target === 'specific').map(s => s.id);
        if (specificIds.length > 0) {
          const targetsRes = await db.query(
            `SELECT t.slide_id, t.display_id, d.name AS display_name
             FROM display_slide_targets t
             JOIN tv_displays d ON d.id = t.display_id
             WHERE t.slide_id = ANY($1::uuid[])`,
            [specificIds],
          );
          const targetsMap: Record<string, { display_id: string; display_name: string }[]> = {};
          for (const row of targetsRes.rows) {
            if (!targetsMap[row.slide_id]) targetsMap[row.slide_id] = [];
            targetsMap[row.slide_id].push({ display_id: row.display_id, display_name: row.display_name });
          }
          for (const slide of slides) {
            slide.display_targets = targetsMap[slide.id] ?? [];
          }
        } else {
          for (const slide of slides) slide.display_targets = [];
        }
      }

      return json(slides);
    } catch (e: any) {
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('slides-list', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // POST /api/v1/slides  — Admin: create slide
  if (path === '/api/v1/slides' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const body = await req.json() as Record<string, unknown>;

      const title            = vString(body.title, 'title', { max: 200 });
      const slide_type       = vEnum(body.slide_type, 'slide_type', SLIDE_TYPES);
      const duration_seconds = body.duration_seconds !== undefined
        ? vInt(body.duration_seconds, 'duration_seconds', 2, 60) : 5;
      const sort_order       = body.sort_order !== undefined
        ? vInt(body.sort_order, 'sort_order', 0, 9999) : 0;
      const target           = body.target !== undefined
        ? vEnum(body.target, 'target', ['all', 'specific'] as const) : 'all';
      const is_active        = body.is_active !== undefined ? !!body.is_active : true;
      const starts_at        = body.starts_at ? new Date(body.starts_at as string).toISOString() : null;
      const ends_at          = body.ends_at   ? new Date(body.ends_at   as string).toISOString() : null;

      const content = validateSlideContent(slide_type, body.content);

      const result = await db.query(
        `INSERT INTO display_slides
           (title, slide_type, content, duration_seconds, sort_order, target, is_active, starts_at, ends_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, title, slide_type, content, duration_seconds, sort_order, target, is_active, starts_at, ends_at, created_at`,
        [title, slide_type, JSON.stringify(content), duration_seconds, sort_order, target, is_active, starts_at, ends_at],
      );
      const slide = result.rows[0];

      const displayIds: string[] = [];
      if (target === 'specific' && Array.isArray(body.display_ids)) {
        for (const did of body.display_ids) {
          const dId = vUuid(did, 'display_id');
          displayIds.push(dId);
          await db.query(
            'INSERT INTO display_slide_targets (slide_id, display_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [slide.id, dId],
          );
        }
      }

      notifyDevices(target, displayIds, slide);
      return json({ ...slide, display_targets: displayIds }, 201);
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('slides-create', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  const slideMatch = path.match(/^\/api\/v1\/slides\/([^/]+)$/);

  // PATCH /api/v1/slides/:id  — Admin: update slide
  if (slideMatch && req.method === 'PATCH') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const id   = vUuid(slideMatch[1], 'id');
      const body = await req.json() as Record<string, unknown>;

      const setClauses: string[] = [];
      const values: unknown[]    = [];

      if (body.title            !== undefined) setClauses.push(`title            = $${values.push(vString(body.title, 'title', { max: 200 }))}`);
      if (body.duration_seconds !== undefined) setClauses.push(`duration_seconds = $${values.push(vInt(body.duration_seconds, 'duration_seconds', 2, 60))}`);
      if (body.sort_order       !== undefined) setClauses.push(`sort_order       = $${values.push(vInt(body.sort_order, 'sort_order', 0, 9999))}`);
      if (body.target           !== undefined) setClauses.push(`target           = $${values.push(vEnum(body.target, 'target', ['all', 'specific'] as const))}`);
      if (body.is_active        !== undefined) setClauses.push(`is_active        = $${values.push(!!body.is_active)}`);
      if ('starts_at' in body) setClauses.push(`starts_at = $${values.push(body.starts_at ? new Date(body.starts_at as string).toISOString() : null)}`);
      if ('ends_at'   in body) setClauses.push(`ends_at   = $${values.push(body.ends_at   ? new Date(body.ends_at   as string).toISOString() : null)}`);

      if (body.content !== undefined) {
        const current = await db.query('SELECT slide_type FROM display_slides WHERE id = $1', [id]);
        if (!current.rows[0]) return json({ error: 'Not found' }, 404);
        const content = validateSlideContent(current.rows[0].slide_type, body.content);
        setClauses.push(`content = $${values.push(JSON.stringify(content))}`);
      }

      if (!setClauses.length && !('display_ids' in body)) {
        return json({ error: 'No valid fields to update' }, 400);
      }

      let slide = null;
      if (setClauses.length) {
        values.push(id);
        const result = await db.query(
          `UPDATE display_slides SET ${setClauses.join(', ')}, updated_at = NOW()
           WHERE id = $${values.length} RETURNING *`,
          values,
        );
        if (!result.rows[0]) return json({ error: 'Not found' }, 404);
        slide = result.rows[0];
      } else {
        const r = await db.query('SELECT * FROM display_slides WHERE id = $1', [id]);
        if (!r.rows[0]) return json({ error: 'Not found' }, 404);
        slide = r.rows[0];
      }

      const displayIds: string[] = [];
      if ('display_ids' in body && Array.isArray(body.display_ids)) {
        await db.query('DELETE FROM display_slide_targets WHERE slide_id = $1', [id]);
        for (const did of body.display_ids) {
          const dId = vUuid(did, 'display_id');
          displayIds.push(dId);
          await db.query(
            'INSERT INTO display_slide_targets (slide_id, display_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [id, dId],
          );
        }
      } else {
        const existing = await db.query('SELECT display_id FROM display_slide_targets WHERE slide_id = $1', [id]);
        existing.rows.forEach(r => displayIds.push(r.display_id));
      }

      notifyDevices(slide.target, displayIds, slide);
      return json({ ...slide, display_targets: displayIds });
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('slides-update', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // DELETE /api/v1/slides/:id
  if (slideMatch && req.method === 'DELETE') {
    try {
      const user = authenticate(req);
      requireAdmin(user);
      const id = vUuid(slideMatch[1], 'id');

      const existing = await db.query('SELECT target FROM display_slides WHERE id = $1', [id]);
      const targets  = await db.query('SELECT display_id FROM display_slide_targets WHERE slide_id = $1', [id]);
      const displayIds = targets.rows.map(r => r.display_id);

      await db.query('DELETE FROM display_slides WHERE id = $1', [id]);

      if (existing.rows[0]) {
        notifyDevices(existing.rows[0].target, displayIds, { deleted: true, id });
      }
      return json({ ok: true });
    } catch (e: any) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      if (e.message?.includes('Forbidden')) return json({ error: e.message }, 403);
      if (e.message?.includes('Missing') || e.message?.includes('Unauthorized')) return json({ error: 'Unauthorized' }, 401);
      logError('slides-delete', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  return null;
}

// ── Helpers ──────────────────────────────────────────────────

function validateSlideContent(
  slideType: string,
  rawContent: unknown,
): Record<string, unknown> {
  const c = (rawContent ?? {}) as Record<string, unknown>;
  switch (slideType) {
    case 'text':      // Notice / Announcement: heading + body
      return {
        heading: String(c.heading ?? ''),
        body:    String(c.body    ?? ''),
      };
    case 'quote_avatar':
      return {
        text:        String(c.text        ?? ''),
        author:      String(c.author      ?? ''),
        designation: String(c.designation ?? ''),
        avatar_url:  c.avatar_url ? String(c.avatar_url) : null,
      };
    case 'image':     // Event/holiday image with title overlay
      return {
        image_url: String(c.image_url ?? ''),
        title:     String(c.title     ?? ''),
        subtitle:  c.subtitle ? String(c.subtitle) : null,
      };
    case 'birthday':
      return {
        name:        String(c.name        ?? ''),
        designation: String(c.designation ?? ''),
        image_url:   c.image_url ? String(c.image_url) : null,
      };
    default:
      return c as Record<string, unknown>;
  }
}

function notifyDevices(target: string, displayIds: string[], slideData: unknown): void {
  const payload = { slide: slideData };
  if (target === 'all') {
    broadcastToAllDevices('display:slides_updated', payload);
  } else if (displayIds.length > 0) {
    broadcastToDevices(displayIds, 'display:slides_updated', payload);
  }
}
