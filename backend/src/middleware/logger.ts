/**
 * Structured JSON logger — every request gets a unique ID that flows
 * through to the response header (X-Request-Id) and all log lines,
 * making it easy to trace a full request in any log aggregator.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function createRequestId(): string {
  // 8 random chars + timestamp suffix = collision-resistant, readable IDs
  return Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

function log(level: LogLevel, data: Record<string, unknown>): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, ...data });
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function logRequest(params: {
  requestId: string;
  method:    string;
  path:      string;
  status:    number;
  durationMs: number;
  userId?:   string;
  ip?:       string;
}): void {
  log('info', { type: 'request', ...params });
}

export function logError(requestId: string, error: unknown, context?: Record<string, unknown>): void {
  const err = error as Error;
  log('error', {
    type:      'error',
    requestId,
    message:   err?.message ?? String(error),
    stack:     err?.stack?.split('\n').slice(0, 5).join(' | '),
    ...context,
  });
}

export function logStartup(message: string, data?: Record<string, unknown>): void {
  log('info', { type: 'startup', message, ...data });
}

export function logInfo(message: string, data?: Record<string, unknown>): void {
  log('info', { type: 'app', message, ...data });
}

export function logWarn(message: string, data?: Record<string, unknown>): void {
  log('warn', { type: 'app', message, ...data });
}

/** Attach requestId + timing to every response */
export function withRequestMeta(
  res: Response,
  requestId: string,
  startMs: number,
): Response {
  const newHeaders = new Headers(res.headers);
  newHeaders.set('X-Request-Id', requestId);
  newHeaders.set('X-Response-Time', `${Date.now() - startMs}ms`);
  return new Response(res.body, { status: res.status, headers: newHeaders });
}
