import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDatabase, type Db } from './db.js';

const temporaryDirs: string[] = [];
const openDbs: Db[] = [];

/** A SQL fragment that does real damage if it ever reaches a query unparameterized. */
export const SQL_INJECTION = "'; DROP TABLE products; --";

/** Creates a temporary directory that `cleanupTemporaryState` will remove. */
export function temporaryDir(prefix = 'miniapp-test-'): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirs.push(dir);
  return dir;
}

/**
 * Opens an isolated on-disk database in a temporary directory, optionally seeded by `seed`.
 * Closed and removed by `cleanupTemporaryState`.
 */
export function temporaryDb(seed?: (db: Db) => void): Db {
  const db = createDatabase(join(temporaryDir(), 'test.db'));
  openDbs.push(db);
  seed?.(db);
  return db;
}

/** The shared catalog fixture: two categories with products, plus an empty one. */
export function seedCatalog(db: Db): void {
  const insertCategory = db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)');
  const insertProduct = db.prepare(
    `INSERT INTO products
      (id, title, price, discount_percentage, rating, brand, category_id, thumbnail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertCategory.run(1, 'Beauty', 'beauty');
  insertCategory.run(2, 'Groceries', 'groceries');
  insertCategory.run(3, 'Accessories', 'accessories');

  insertProduct.run(1, 'Lipstick Red', 12.5, 20, 4.5, 'Chic', 1, 'thumb-1.jpg');
  insertProduct.run(2, 'Powder Canister', 14.99, 0, 4.7, 'Powdal', 1, 'thumb-2.jpg');
  insertProduct.run(3, 'Tal Bowl', 17.99, 5, 4.9, 'Green', 2, 'thumb-3.jpg');
  insertProduct.run(4, 'Egg White', 9.49, 10, 4.2, 'Farm', 2, 'thumb-4.jpg');
}

/** Closes every database `temporaryDb` opened and deletes every temporary directory. */
export function cleanupTemporaryState(): void {
  while (openDbs.length > 0) {
    openDbs.pop()!.close();
  }
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop()!, { recursive: true, force: true });
  }
}
