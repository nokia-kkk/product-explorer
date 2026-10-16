import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDatabase, type Db } from './db';
import { listCategories } from './categories';

const temporaryDirs: string[] = [];

function temporaryDb(): Db {
  const dir = mkdtempSync(join(tmpdir(), 'miniapp-categories-'));
  temporaryDirs.push(dir);
  const db = createDatabase(join(dir, 'test.db'));
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

  return db;
}

afterEach(() => {
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop()!, { recursive: true, force: true });
  }
});

describe('listCategories', () => {
  it('returns all categories with product counts, ordered by name ascending', () => {
    const db = temporaryDb();

    const response = listCategories(db);

    expect(response).toEqual({
      data: [
        { id: 3, name: 'Accessories', slug: 'accessories', productCount: 0 },
        { id: 1, name: 'Beauty', slug: 'beauty', productCount: 2 },
        { id: 2, name: 'Groceries', slug: 'groceries', productCount: 2 },
      ],
      meta: { total: 3 },
    });

    db.close();
  });

  it('reports meta.total as the number of categories', () => {
    const db = temporaryDb();

    const response = listCategories(db);

    expect(response.meta).toEqual({ total: response.data.length });

    db.close();
  });

  it('orders by name ascending, case-sensitive collation included', () => {
    const db = temporaryDb();
    db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(
      4,
      'Fragrance',
      'fragrance'
    );

    const response = listCategories(db);

    expect(response.data.map((c) => c.name)).toEqual([
      'Accessories',
      'Beauty',
      'Fragrance',
      'Groceries',
    ]);

    db.close();
  });

  it('returns an empty response when there are no categories', () => {
    const dir = mkdtempSync(join(tmpdir(), 'miniapp-categories-'));
    temporaryDirs.push(dir);
    const db = createDatabase(join(dir, 'empty.db'));

    const response = listCategories(db);

    expect(response).toEqual({ data: [], meta: { total: 0 } });

    db.close();
  });
});
