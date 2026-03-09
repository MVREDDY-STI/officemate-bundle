import { createHash }  from 'node:crypto';
import db              from '../db/client';
import { signAccessToken, signRefreshToken, verifyToken } from '../middleware/auth';
import { loginLimiter, tooManyRequests }                  from '../middleware/rateLimit';
import { vEmail, vString, ValidationError, validationErrorResponse } from '../middleware/validate';
import { logError }    from '../middleware/logger';
import type { AuthUser } from '../middleware/types';

// ── Password hashing ──────────────────────────────────────────
// Bun.password uses bcrypt (cost 10) — intentionally slow, defeats brute force.
// Falls back gracefully for legacy SHA-256 hashes and re-hashes them on login.

async function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, { algorithm: 'bcrypt', cost: 10 });
}

async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (stored.startsWith('$2')) {
    // bcrypt hash
    return Bun.password.verify(plain, stored);
  }
  // Legacy SHA-256 — compare then signal caller to upgrade
  const legacy = createHash('sha256')
    .update(plain + (process.env.JWT_SECRET ?? ''))
    .digest('hex');
  return legacy === stored;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getIp(req: Request): string {
  return (
    req.headers.get('X-Real-IP') ??
    req.headers.get('X-Forwarded-For')?.split(',')[0].trim() ??
    'unknown'
  );
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleAuth(req: Request, path: string): Promise<Response | null> {

  // ── POST /api/v1/auth/signup ─────────────────────────────
  if (path === '/api/v1/auth/signup' && req.method === 'POST') {
    try {
      const body     = await req.json() as Record<string, unknown>;
      const name     = vString(body.name,     'name',     { min: 2, max: 100 });
      const email    = vEmail(body.email);
      const password = vString(body.password, 'password', { min: 8, max: 128 });

      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows[0]) return json({ error: 'Email already registered' }, 409);

      const hashed = await hashPassword(password);
      await db.query(
        'INSERT INTO users (email, password_hash, name, is_approved) VALUES ($1, $2, $3, false)',
        [email, hashed, name],
      );

      return json({ message: 'Registration submitted, awaiting admin approval' }, 201);
    } catch (e) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      logError('auth-signup', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // ── POST /api/v1/auth/login ──────────────────────────────
  if (path === '/api/v1/auth/login' && req.method === 'POST') {
    const ip = getIp(req);
    const rl = loginLimiter(ip);
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSec);

    try {
      const body = await req.json() as Record<string, unknown>;
      const email    = vEmail(body.email);
      const password = vString(body.password, 'password', { min: 1, max: 128 });

      const result = await db.query(
        'SELECT id, email, name, role, password_hash, is_approved FROM users WHERE email = $1',
        [email],
      );
      const user = result.rows[0];

      // Always verify (even on miss) to prevent timing-based user enumeration
      const isValid = user ? await verifyPassword(password, user.password_hash) : false;
      if (!user || !isValid) return json({ error: 'Invalid credentials' }, 401);

      // Check admin approval before issuing tokens
      if (!user.is_approved) {
        return json({ error: 'approval_pending', message: 'Your account is pending admin approval.' }, 403);
      }

      // Transparent upgrade: re-hash legacy SHA-256 → bcrypt on next login
      if (user.password_hash && !user.password_hash.startsWith('$2')) {
        const upgraded = await hashPassword(password);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [upgraded, user.id]);
      }

      const payload: AuthUser = { id: user.id, email: user.email, name: user.name, role: user.role };
      const accessToken  = signAccessToken(payload);
      const refreshToken = signRefreshToken({ userId: user.id });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, hashToken(refreshToken), expiresAt],
      );

      return json({ token: accessToken, refreshToken, user: payload });

    } catch (e) {
      if (e instanceof ValidationError) return validationErrorResponse(e);
      logError('auth-login', e);
      return json({ error: 'Server error' }, 500);
    }
  }

  // ── POST /api/v1/auth/refresh ────────────────────────────
  if (path === '/api/v1/auth/refresh' && req.method === 'POST') {
    try {
      const body = await req.json() as Record<string, unknown>;
      if (typeof body.refreshToken !== 'string') return json({ error: 'refreshToken required' }, 400);

      const { userId } = verifyToken(body.refreshToken) as unknown as { userId: string };
      const tokenHash  = hashToken(body.refreshToken);

      const result = await db.query(
        `SELECT rt.id, u.id as uid, u.email, u.name, u.role
         FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id
         WHERE rt.token_hash = $1 AND rt.user_id = $2 AND rt.expires_at > NOW()`,
        [tokenHash, userId],
      );
      if (!result.rows[0]) return json({ error: 'Invalid or expired refresh token' }, 401);

      const u       = result.rows[0];
      const payload: AuthUser = { id: u.uid, email: u.email, name: u.name, role: u.role };
      return json({ token: signAccessToken(payload) });

    } catch {
      return json({ error: 'Invalid refresh token' }, 401);
    }
  }

  // ── POST /api/v1/auth/logout ─────────────────────────────
  if (path === '/api/v1/auth/logout' && req.method === 'POST') {
    try {
      const body = await req.json() as Record<string, unknown>;
      if (typeof body.refreshToken === 'string') {
        await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [hashToken(body.refreshToken)]);
      }
    } catch { /* best-effort */ }
    return json({ ok: true });
  }

  return null;
}
