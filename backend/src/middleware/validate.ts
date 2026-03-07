/** Typed input validators — throw ValidationError on bad input */

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function isValidationError(e: unknown): e is ValidationError {
  return e instanceof ValidationError;
}

// ─── Primitive validators ────────────────────────────────────

export function vString(value: unknown, field: string, opts?: { min?: number; max?: number }): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`${field} is required and must be a non-empty string`, field);
  }
  const s = value.trim();
  if (opts?.min && s.length < opts.min)
    throw new ValidationError(`${field} must be at least ${opts.min} characters`, field);
  if (opts?.max && s.length > opts.max)
    throw new ValidationError(`${field} must be under ${opts.max} characters`, field);
  return s;
}

export function vStringOptional(value: unknown, field: string, max = 1000): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`, field);
  if (value.length > max) throw new ValidationError(`${field} must be under ${max} characters`, field);
  return value.trim() || undefined;
}

export function vEmail(value: unknown): string {
  const s = vString(value, 'email');
  // Basic email pattern — full RFC 5322 is overkill here
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    throw new ValidationError('Must be a valid email address', 'email');
  }
  return s.toLowerCase();
}

export function vInt(value: unknown, field: string, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(`${field} must be an integer between ${min} and ${max}`, field);
  }
  return n;
}

export function vDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${field} must be a date in YYYY-MM-DD format`, field);
  }
  if (isNaN(Date.parse(value))) {
    throw new ValidationError(`${field} is not a valid calendar date`, field);
  }
  return value;
}

export function vEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (!allowed.includes(value as T)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}`, field);
  }
  return value as T;
}

export function vUuid(value: unknown, field: string): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new ValidationError(`${field} must be a valid UUID`, field);
  }
  return value;
}

// ─── Pagination helper ────────────────────────────────────────

export function parsePagination(url: URL): { page: number; limit: number; offset: number } {
  const page  = Math.max(1, Number(url.searchParams.get('page')  ?? 1));
  const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') ?? 20)), 100);
  return { page, limit, offset: (page - 1) * limit };
}

// ─── Standard error response builder ─────────────────────────

export function validationErrorResponse(e: ValidationError): Response {
  return new Response(
    JSON.stringify({ error: e.message, field: e.field }),
    { status: 422, headers: { 'Content-Type': 'application/json' } },
  );
}
