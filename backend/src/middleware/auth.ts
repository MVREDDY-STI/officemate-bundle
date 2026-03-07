import jwt from 'jsonwebtoken';
import type { AuthUser } from './types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change_me_dev_secret_at_least_32_chars!';

export function signAccessToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (e: any) {
    // Normalise JWT errors into a consistent 401 message so every route
    // catches them with the same "Unauthorized" check.
    throw new Error('Unauthorized: ' + (e.message ?? 'invalid token'));
  }
}

/** Extract and verify Bearer token from Authorization header */
export function authenticate(req: Request): AuthUser {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}

/** Same but allows ?token=JWT (for WebSocket handshake) */
export function authenticateWs(req: Request): AuthUser {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) throw new Error('Missing token');
  return verifyToken(token);
}

/** Require admin role — throws if not admin */
export function requireAdmin(user: AuthUser): void {
  if (user.role !== 'admin') throw new Error('Forbidden: admin only');
}
