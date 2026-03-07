/**
 * Run the seed.sql against the configured database.
 * Replaces placeholder bcrypt hashes in seed.sql with real bcrypt hashes
 * generated via Bun.password (cost 10).
 * Usage: bun run src/db/seed.ts
 */
import db from './client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

async function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, { algorithm: 'bcrypt', cost: 10 });
}

const seedPath = join(import.meta.dir, 'seed.sql');
let seedSql = readFileSync(seedPath, 'utf-8');

console.log('🔑 Generating bcrypt hashes…');
const [adminHash, userHash] = await Promise.all([
  hashPassword('admin123'),
  hashPassword('user123'),
]);

// Replace placeholder strings with real bcrypt hashes
seedSql = seedSql
  .replace('$2b$12$placeholder_bcrypt_hash_admin', adminHash)
  .replace('$2b$12$placeholder_bcrypt_hash_user',  userHash);

console.log('🌱 Running seed…');
await db.query(seedSql);
console.log('✅ Seed complete');
await db.end();
