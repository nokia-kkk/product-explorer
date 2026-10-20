import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../packages/server/dist/index.js';
import { createDatabase } from '../packages/server/dist/db.js';

// Vercel's filesystem is read-only apart from the temp dir, and SQLite writes
// its WAL alongside the database. Copy the bundled database there once per
// instance; the file is small and read-only in practice, so one copy is enough.
const dbPath = join(tmpdir(), 'app.db');
if (!existsSync(dbPath)) {
  mkdirSync(tmpdir(), { recursive: true });
  copyFileSync(join(process.cwd(), 'data/app.db'), dbPath);
}

export default createApp(createDatabase(dbPath));
