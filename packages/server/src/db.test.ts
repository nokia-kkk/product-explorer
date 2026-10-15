import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { createDatabase, runMigrations } from './db';

const temporaryDirs: string[] = [];

function temporaryDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'miniapp-db-'));
  temporaryDirs.push(dir);
  return join(dir, 'test.db');
}

afterEach(() => {
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop()!, { recursive: true, force: true });
  }
});

function columnNames(db: Database.Database, table: string): string[] {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.map((row) => row.name);
}

describe('createDatabase', () => {
  it('creates the categories and products tables with the agreed schema', () => {
    const db = createDatabase(temporaryDbPath());

    expect(columnNames(db, 'categories')).toEqual(['id', 'name', 'slug']);
    expect(columnNames(db, 'products')).toEqual([
      'id',
      'title',
      'description',
      'price',
      'discount_percentage',
      'rating',
      'stock',
      'brand',
      'category_id',
      'thumbnail',
      'images_json',
    ]);

    db.close();
  });

  it('creates the category and title indexes', () => {
    const db = createDatabase(temporaryDbPath());

    const indexes = (db.prepare('PRAGMA index_list(products)').all() as { name: string }[]).map(
      (row) => row.name
    );

    expect(indexes).toContain('idx_products_category');
    expect(indexes).toContain('idx_products_title');

    db.close();
  });

  it('enforces the products.category_id foreign key', () => {
    const db = createDatabase(temporaryDbPath());
    const insertProduct = (categoryId: number) =>
      db
        .prepare('INSERT INTO products (id, title, price, category_id) VALUES (?, ?, ?, ?)')
        .run(1, 'Widget', 9.99, categoryId);

    expect(() => insertProduct(999)).toThrow(/FOREIGN KEY/i);

    db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(
      1,
      'Beauty',
      'beauty'
    );
    insertProduct(1);
    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 1 });

    expect(() => db.prepare('DELETE FROM categories WHERE id = 1').run()).toThrow(/FOREIGN KEY/i);

    db.close();
  });
});

describe('runMigrations', () => {
  it('is idempotent: re-running on an already-migrated database changes nothing', () => {
    const path = temporaryDbPath();
    const first = createDatabase(path);
    const version = first.pragma('user_version', { simple: true });
    first.close();

    const second = createDatabase(path);
    expect(() => {
      runMigrations(second);
      runMigrations(second);
    }).not.toThrow();
    expect(second.pragma('user_version', { simple: true })).toBe(version);
    expect(columnNames(second, 'products')).toHaveLength(11);

    second.close();
  });
});
