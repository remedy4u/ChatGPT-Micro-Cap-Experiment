import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../migrations');

async function run() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, applied_at TIMESTAMP NOT NULL DEFAULT NOW())`);
  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const already = await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1', [file]);
    if (already.rowCount) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }
  }
  await pool.end();
}

run().catch((e) => {
  console.error('Migration failed', e);
  process.exit(1);
});
