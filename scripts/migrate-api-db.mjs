import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env.supabase');

if (existsSync(envPath)) {
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
});

try {
  const sql = await readFile(resolve(root, 'db/migrations/001_postgres_sync.sql'), 'utf8');
  await pool.query(sql);
  console.log('PostgreSQL schema is ready.');
} finally {
  await pool.end();
}
