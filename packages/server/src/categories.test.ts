import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from './db.js';
import { listCategories } from './categories.js';
import { cleanupTemporaryState, seedCatalog, temporaryDb } from './testing.js';

let db: Db;

beforeEach(() => {
  db = temporaryDb(seedCatalog);
});

afterEach(cleanupTemporaryState);

describe('listCategories', () => {
  it('returns all categories with product counts, ordered by name ascending', () => {
    const response = listCategories(db);

    expect(response).toEqual({
      data: [
        { id: 3, name: 'Accessories', slug: 'accessories', productCount: 0 },
        { id: 1, name: 'Beauty', slug: 'beauty', productCount: 2 },
        { id: 2, name: 'Groceries', slug: 'groceries', productCount: 2 },
      ],
      meta: { total: 3 },
    });
  });

  it('reports meta.total as the number of categories', () => {
    const response = listCategories(db);

    expect(response.meta).toEqual({ total: response.data.length });
  });

  it('orders by name ascending, case-sensitive collation included', () => {
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
  });

  it('returns an empty response when there are no categories', () => {
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM categories').run();

    const response = listCategories(db);

    expect(response).toEqual({ data: [], meta: { total: 0 } });
  });
});
