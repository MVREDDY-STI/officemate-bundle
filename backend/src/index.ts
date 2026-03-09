import { corsHeaders, optionsResponse } from './middleware/cors';
import { authenticateWs } from './middleware/auth';
import { addClient, removeClient, addDeviceClient, removeDeviceClient } from './ws/hub';
import { apiLimiter, tooManyRequests } from './middleware/rateLimit';
import { createRequestId, logRequest, logStartup, withRequestMeta } from './middleware/logger';
import { ensureStorageReady } from './services/storage';

import { handleAuth }     from './routes/auth';
import { handleContent }  from './routes/content';
import { handleRooms }    from './routes/rooms';
import { handleBookings } from './routes/bookings';
import { handleEvents }   from './routes/events';
import { handleGuests }   from './routes/guests';
import { handleAssets }   from './routes/assets';
import { handleSupport }  from './routes/support';
import { handleBuilding } from './routes/building';
import { handleUsers }    from './routes/users';
import { handleTeam }     from './routes/team';
import { handleTeams }    from './routes/teams';
import { handleUploads }  from './routes/uploads';
import { handleDisplays } from './routes/displays';
import { handleSlides }   from './routes/slides';
import { handleLogo }     from './routes/logo';
import { openApiSpec, swaggerUiHtml } from './swagger/spec';
import db from './db/client';

const PORT = Number(process.env.PORT ?? 3000);

// ── Startup tasks ────────────────────────────────────────────
await ensureStorageReady();

function getIp(req: Request): string {
  return (
    req.headers.get('X-Real-IP') ??
    req.headers.get('X-Forwarded-For')?.split(',')[0].trim() ??
    'unknown'
  );
}

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

const server = Bun.serve({
  port: PORT,

  // ── WebSocket upgrade ────────────────────────────────────
  async fetch(req, server) {
    const url    = new URL(req.url);
    const origin = req.headers.get('Origin') ?? undefined;

    // CORS preflight
    if (req.method === 'OPTIONS') return optionsResponse(req);

    // WebSocket upgrade at /ws  (user JWT auth)
    if (url.pathname === '/ws') {
      try {
        const user     = authenticateWs(req);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upgraded = server.upgrade(req, { data: { userId: user.id, clientType: 'user' } } as any);
        if (upgraded) return undefined as any;
        return json({ error: 'WebSocket upgrade failed' }, 426);
      } catch (e: any) {
        return json({ error: e.message ?? 'Unauthorized' }, 401);
      }
    }

    // WebSocket upgrade at /ws/display  (device token auth)
    if (url.pathname === '/ws/display') {
      try {
        const token = url.searchParams.get('device_token');
        if (!token) return json({ error: 'Missing device_token' }, 401);

        const dbResult = await db.query(
          'SELECT id FROM tv_displays WHERE device_token = $1',
          [token],
        );
        if (!dbResult.rows[0]) return json({ error: 'Invalid device token' }, 401);
        const displayId = dbResult.rows[0].id;

        // Mark online
        await db.query(
          'UPDATE tv_displays SET is_online = TRUE, last_seen_at = NOW() WHERE id = $1',
          [displayId],
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upgraded = server.upgrade(req, { data: { displayId, clientType: 'device' } } as any);
        if (upgraded) return undefined as any;
        return json({ error: 'WebSocket upgrade failed' }, 426);
      } catch (e: any) {
        return json({ error: e.message ?? 'Unauthorized' }, 401);
      }
    }

    // Swagger UI
    if (url.pathname === '/docs') {
      return html(swaggerUiHtml('/api/v1/docs'));
    }

    // OpenAPI JSON spec
    if (url.pathname === '/api/v1/docs') {
      return json(openApiSpec, 200, corsHeaders(origin));
    }

    // Health check — bypass rate limiter
    if (url.pathname === '/health') {
      return json({ status: 'ok', uptime: process.uptime() }, 200, corsHeaders(origin));
    }

    // Route all API calls through handlers
    return handleRequest(req, url.pathname, origin);
  },

  // ── WebSocket handlers ───────────────────────────────────
  websocket: {
    open(ws) {
      const data = ws.data as any;
      if (data.clientType === 'device') {
        const client = addDeviceClient(ws as unknown as WebSocket, data.displayId);
        (ws as any)._client = client;
        (ws as any)._clientType = 'device';
        ws.send(JSON.stringify({ event: 'connected', data: { message: 'Display connected' } }));
      } else {
        const client = addClient(ws as unknown as WebSocket, data.userId);
        (ws as any)._client = client;
        (ws as any)._clientType = 'user';
        ws.send(JSON.stringify({ event: 'connected', data: { message: 'Welcome to SOLUM Officemate live updates' } }));
      }
    },
    message(ws, message) {
      try {
        const { action } = JSON.parse(message as string) as { action: string };
        if (action === 'ping') ws.send(JSON.stringify({ event: 'pong' }));
      } catch { /* ignore malformed messages */ }
    },
    async close(ws) {
      const client = (ws as any)._client;
      const clientType = (ws as any)._clientType;
      if (clientType === 'device') {
        if (client) removeDeviceClient(client);
        // Mark display offline
        try {
          await db.query(
            'UPDATE tv_displays SET is_online = FALSE WHERE id = $1',
            [(ws.data as any).displayId],
          );
        } catch { /* non-critical */ }
      } else {
        if (client) removeClient(client);
      }
    },
  },
});

// Route handlers in priority order — first non-null response wins
const ROUTE_HANDLERS = [
  handleAuth,
  handleUploads,
  handleLogo,
  handleDisplays,
  handleSlides,
  handleContent,
  handleRooms,
  handleBookings,
  handleEvents,
  handleGuests,
  handleAssets,
  handleSupport,
  handleBuilding,
  handleUsers,
  handleTeam,
  handleTeams,
] as const;

async function handleRequest(req: Request, path: string, origin?: string): Promise<Response> {
  const requestId = createRequestId();
  const startMs   = Date.now();
  const cors      = corsHeaders(origin);
  const ip        = getIp(req);

  // ── Per-IP rate limit (all API routes) ──────────────────
  const rl = apiLimiter(ip);
  if (!rl.allowed) {
    const res = tooManyRequests(rl.retryAfterSec);
    logRequest({ requestId, method: req.method, path, status: 429, durationMs: Date.now() - startMs, ip });
    return withRequestMeta(addCors(res, cors), requestId, startMs);
  }

  try {
    for (const handler of ROUTE_HANDLERS) {
      const res = await handler(req, path);
      if (res) {
        logRequest({ requestId, method: req.method, path, status: res.status, durationMs: Date.now() - startMs, ip });
        return withRequestMeta(addCors(res, cors), requestId, startMs);
      }
    }

    // 404 — no handler matched
    logRequest({ requestId, method: req.method, path, status: 404, durationMs: Date.now() - startMs, ip });
    return withRequestMeta(json({ error: `Not found: ${path}` }, 404, cors), requestId, startMs);

  } catch (e: any) {
    logRequest({ requestId, method: req.method, path, status: 500, durationMs: Date.now() - startMs, ip });
    return withRequestMeta(json({ error: 'Internal server error' }, 500, cors), requestId, startMs);
  }
}

function addCors(res: Response, cors: Record<string, string>): Response {
  const newHeaders = new Headers(res.headers);
  for (const [k, v] of Object.entries(cors)) newHeaders.set(k, v);
  return new Response(res.body, { status: res.status, headers: newHeaders });
}

// ── Graceful shutdown ────────────────────────────────────────
function shutdown(signal: string) {
  logStartup(`Received ${signal} — shutting down gracefully`);
  server.stop(true);        // stop accepting new connections; drain existing
  db.end().finally(() => {
    logStartup('DB pool closed — exiting');
    process.exit(0);
  });
  // Force-exit after 10 s if drain hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

logStartup('SOLUM Officemate API ready', { port: PORT });
logStartup('Swagger UI available',        { url: `http://localhost:${PORT}/docs` });
logStartup('WebSocket endpoint',          { url: `ws://localhost:${PORT}/ws?token=<JWT>` });
