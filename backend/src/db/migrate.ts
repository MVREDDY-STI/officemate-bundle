/**
 * Run the schema.sql migration against the configured database.
 * Usage: bun run src/db/migrate.ts
 */
import db from './client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schemaPath = join(import.meta.dir, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

console.log('🗄️  Running migrations…');
await db.query(schema);
console.log('✅ Migration complete');
await db.end();
