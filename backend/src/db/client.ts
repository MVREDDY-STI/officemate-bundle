import { Pool } from 'pg';

const db = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://solum:password@localhost:5432/officemate',
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

export default db;
