import { describe, it, expect, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { createDatabase, runMigrations, type Db } from './db.js';
import { listCategories } from './categories.js';
import { getProduct, listProducts } from './products.js';
import { SQL_INJECTION, cleanupTemporaryState, temporaryDir, temporaryDb } from './testing.js';

afterEach(cleanupTemporaryState);

function temporaryDbPath(): string {
  return join(temporaryDir('miniapp-db-'), 'test.db');
}

interface Prepared {
  sql: string;
  plan: string;
}

/**
 * Runs `query` against a throwaway seeded database and returns each statement it prepared paired
 * with that statement's query plan.
 */
function preparedSql(query: (db: Db) => void): Prepared[] {
  const db = temporaryDb((seeded) => {
    seeded
      .prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)')
      .run(1, 'Beauty', 'beauty');
    for (let id = 1; id <= 20; id += 1) {
      seeded
        .prepare(
          'INSERT INTO products (id, title, price, rating, category_id) VALUES (?, ?, ?, ?, ?)'
        )
        .run(id, `Product ${id}`, id * 1.5, 4 + id / 100, 1);
    }
  });

  const prepare = vi.spyOn(db, 'prepare');
  try {
    query(db);
    return prepare.mock.calls.map(([sql]) => ({ sql, plan: queryPlan(db, sql) }));
  } finally {
    prepare.mockRestore();
  }
}

function queryPlan(db: Db, sql: string, ...params: unknown[]): string {
  const placeholders = sql.split('?').length - 1;
  const bound = params.length > 0 ? params : Array(placeholders).fill(0);
  const steps = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...bound) as { detail: string }[];
  return steps.map((step) => step.detail).join(' | ');
}

function columnNames(db: Database.Database, table: string): string[] {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.map((row) => row.name);
}

describe('createDatabase', () => {
  it('creates the categories and products tables with the agreed schema', () => {
    const db = temporaryDb();

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
  });

  it('creates the category and title indexes', () => {
    const db = temporaryDb();

    const indexes = (db.prepare('PRAGMA index_list(products)').all() as { name: string }[]).map(
      (row) => row.name
    );

    expect(indexes).toContain('idx_products_category');
    expect(indexes).toContain('idx_products_title');
  });

  it('enforces the products.category_id foreign key', () => {
    const db = temporaryDb();
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

describe('parameterized queries', () => {
  /** Every `?` placeholder in the statement. */
  function placeholderCount(statement: string): number {
    return statement.split('?').length - 1;
  }

  it('binds search terms as parameters instead of splicing them into SQL', () => {
    const statements = preparedSql((db) => listProducts(db, { q: SQL_INJECTION }));

    expect(statements.map((s) => s.sql).join('\n')).not.toContain('DROP TABLE');
    expect(statements.some((s) => s.sql.includes('LIKE ?'))).toBe(true);
  });

  it('maps sortBy and order onto fixed SQL fragments', () => {
    const statements = preparedSql((db) => listProducts(db, { sortBy: 'price', order: 'desc' }));

    expect(statements.some((s) => s.sql.includes('ORDER BY p.price DESC, p.id ASC'))).toBe(true);
  });

  it('binds the search term, category, limit, and offset in the listing data query', () => {
    const [count, data] = preparedSql((db) =>
      listProducts(db, { q: 'egg', category: 'beauty', page: 2, limit: 10 })
    );

    expect(count!.sql).toContain('LIKE ?');
    expect(count!.sql).toContain('slug = ?');
    expect(placeholderCount(count!.sql)).toBe(2);

    expect(data!.sql).toContain('LIKE ?');
    expect(data!.sql).toContain('slug = ?');
    expect(data!.sql).toContain('LIMIT ? OFFSET ?');
    expect(placeholderCount(data!.sql)).toBe(4);

    expect(`${count!.sql}\n${data!.sql}`).not.toContain('egg');
    expect(`${count!.sql}\n${data!.sql}`).not.toContain('beauty');
  });

  it('binds the product id in the detail query', () => {
    const statements = preparedSql((db) => getProduct(db, 42));

    expect(statements).toHaveLength(1);
    expect(statements[0]!.sql).toContain('WHERE p.id = ?');
    expect(placeholderCount(statements[0]!.sql)).toBe(1);
  });

  it('binds the limit and offset in the listing query and nothing else when unfiltered', () => {
    const [count, data] = preparedSql((db) => listProducts(db, {}));

    expect(placeholderCount(count!.sql)).toBe(0);
    expect(data!.sql).toContain('LIMIT ? OFFSET ?');
    expect(placeholderCount(data!.sql)).toBe(2);
  });
});

describe('index usage', () => {
  it('resolves a category slug through a unique index rather than scanning categories', () => {
    const db = temporaryDb();

    const plan = queryPlan(db, 'SELECT id FROM categories WHERE slug = ?', 'beauty');

    expect(plan).toContain('SEARCH categories USING COVERING INDEX');
    expect(plan).not.toContain('SCAN categories');
  });

  it('searches the listing by category through idx_products_category', () => {
    const [count, data] = preparedSql((db) => listProducts(db, { category: 'beauty' }));

    expect(count!.plan).toContain('COVERING INDEX idx_products_category');
    expect(data!.plan).toContain('INDEX idx_products_category');
  });

  it('orders an unfiltered listing by title through idx_products_title, with no temp sort', () => {
    const [, data] = preparedSql((db) => listProducts(db, {}));

    expect(data!.plan).toContain('INDEX idx_products_title');
    expect(data!.plan).not.toContain('TEMP B-TREE');
  });

  it('counts each category through idx_products_category when listing categories', () => {
    const [data] = preparedSql((db) => listCategories(db));

    expect(data!.plan).toContain('COVERING INDEX idx_products_category');
    expect(data!.plan).not.toContain('SCAN products');
  });
});

describe('foreign keys', () => {
  it('rejects deleting a category that still has products', () => {
    const db = temporaryDb();
    db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(
      1,
      'Beauty',
      'beauty'
    );
    db.prepare('INSERT INTO products (id, title, price, category_id) VALUES (?, ?, ?, ?)').run(
      1,
      'Widget',
      9.99,
      1
    );

    expect(() => db.prepare('DELETE FROM categories WHERE id = 1').run()).toThrow(/FOREIGN KEY/i);
    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 1 });
  });

  it('rejects re-pointing a product at a category that does not exist', () => {
    const db = temporaryDb();
    db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(
      1,
      'Beauty',
      'beauty'
    );
    db.prepare('INSERT INTO products (id, title, price, category_id) VALUES (?, ?, ?, ?)').run(
      1,
      'Widget',
      9.99,
      1
    );

    expect(() => db.prepare('UPDATE products SET category_id = 99 WHERE id = 1').run()).toThrow(
      /FOREIGN KEY/i
    );
    expect(db.prepare('SELECT category_id FROM products WHERE id = 1').get()).toEqual({
      category_id: 1,
    });
  });

  it('keeps foreign keys on for every connection createDatabase opens', () => {
    const path = temporaryDbPath();
    const writer = createDatabase(path);
    writer
      .prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)')
      .run(1, 'Beauty', 'beauty');
    writer.close();

    const reader = createDatabase(path);
    expect(reader.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(() =>
      reader
        .prepare('INSERT INTO products (id, title, price, category_id) VALUES (?, ?, ?, ?)')
        .run(1, 'Orphan', 1, 99)
    ).toThrow(/FOREIGN KEY/i);

    reader.close();
  });
});
