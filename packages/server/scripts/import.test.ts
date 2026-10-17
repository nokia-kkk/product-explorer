import { describe, it, expect, afterEach, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDatabase } from '../src/db';
import { runImport } from './import';
import { productSchema, categorySchema } from '../src/import';
import { cleanupTemporaryState, temporaryDir } from '../src/testing';
import type { z } from 'zod';

afterEach(cleanupTemporaryState);

type Product = z.infer<typeof productSchema>;
type Category = z.infer<typeof categorySchema>;

const categories: Category[] = [
  { slug: 'beauty', name: 'Beauty', url: 'https://dummyjson.com/products/category/beauty' },
];

const products: Product[] = [
  {
    id: 1,
    title: 'Essence Mascara Lash Princess',
    description: null,
    category: 'beauty',
    price: 9.99,
    discountPercentage: 10.48,
    rating: 2.56,
    stock: 99,
    brand: 'Essence',
    thumbnail: 'https://cdn.dummyjson.com/thumbnail.webp',
    images: ['https://cdn.dummyjson.com/1.webp'],
  },
];

const responses = new Map<string, unknown>([
  ['https://dummyjson.com/products?limit=0', { products, total: 1 }],
  ['https://dummyjson.com/products/categories', categories],
]);

function fakeFetch(): (url: string) => Promise<unknown> {
  return vi.fn((url: string) => {
    if (!responses.has(url)) {
      throw new Error(`no response for ${url}`);
    }
    return Promise.resolve(responses.get(url));
  });
}

describe('runImport', () => {
  it('fetches, caches raw JSON, imports, and logs a summary', async () => {
    const root = temporaryDir();
    const cacheDir = join(root, 'cache');
    const dbPath = join(root, 'data', 'app.db');
    const fetchJson = fakeFetch();
    const log = vi.fn();

    const summary = await runImport({ cacheDir, dbPath, fetchJson, log });

    expect(summary).toEqual({ categories: 1, products: 1 });
    expect(existsSync(join(cacheDir, 'products.json'))).toBe(true);
    expect(existsSync(join(cacheDir, 'categories.json'))).toBe(true);
    expect(JSON.parse(readFileSync(join(cacheDir, 'products.json'), 'utf8'))).toEqual({
      products,
      total: 1,
    });

    const db = createDatabase(dbPath);
    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 1 });
    db.close();

    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]![0]).toMatch(/^Imported 1 categories, 1 products in \d+(\.\d+)?s$/);
  });

  it('re-runs offline from the cache: identical result with no network', async () => {
    const root = temporaryDir();
    const cacheDir = join(root, 'cache');
    const dbPath = join(root, 'data', 'app.db');
    const log = vi.fn();

    await runImport({ cacheDir, dbPath, fetchJson: fakeFetch(), log });

    const offlineDbPath = join(root, 'data', 'offline.db');
    const summary = await runImport({
      cacheDir,
      dbPath: offlineDbPath,
      fetchJson: () => {
        throw new Error('network unavailable');
      },
      log,
    });

    expect(summary).toEqual({ categories: 1, products: 1 });
    const db = createDatabase(offlineDbPath);
    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 1 });
    db.close();
  });

  it('rolls the import back and keeps the cache when the payload is invalid', async () => {
    const root = temporaryDir();
    const cacheDir = join(root, 'cache');
    const dbPath = join(root, 'data', 'app.db');
    const log = vi.fn();

    await runImport({ cacheDir, dbPath, fetchJson: fakeFetch(), log });

    // Stale rows the failing import would delete and never restore if it partly committed.
    const seeded = createDatabase(dbPath);
    seeded
      .prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)')
      .run(42, 'Stale Category', 'stale-category');
    seeded
      .prepare('INSERT INTO products (id, title, price, category_id) VALUES (?, ?, ?, ?)')
      .run(7, 'Stale Product', 1, 42);
    seeded.close();

    const duplicateProducts = [...products, { ...products[0], title: 'Duplicate Mascara' }];
    const duplicateFetch = vi.fn((url: string) =>
      Promise.resolve(
        url === 'https://dummyjson.com/products?limit=0'
          ? { products: duplicateProducts, total: duplicateProducts.length }
          : categories
      )
    );

    await expect(
      runImport({ cacheDir, dbPath, fetchJson: duplicateFetch, refresh: true, log })
    ).rejects.toThrow();

    const db = createDatabase(dbPath);
    expect(db.prepare('SELECT title FROM products WHERE id = 1').get()).toEqual({
      title: 'Essence Mascara Lash Princess',
    });
    expect(db.prepare('SELECT title FROM products WHERE id = 7').get()).toEqual({
      title: 'Stale Product',
    });
    expect(db.prepare('SELECT name FROM categories WHERE id = 42').get()).toEqual({
      name: 'Stale Category',
    });
    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 2 });
    db.close();

    expect(JSON.parse(readFileSync(join(cacheDir, 'products.json'), 'utf8'))).toEqual({
      products: duplicateProducts,
      total: 2,
    });
  });

  it('re-fetches when refresh is set, even though the cache exists', async () => {
    const root = temporaryDir();
    const cacheDir = join(root, 'cache');
    const dbPath = join(root, 'data', 'app.db');
    const log = vi.fn();

    await runImport({ cacheDir, dbPath, fetchJson: fakeFetch(), log });

    const refreshedFetch = fakeFetch();
    await runImport({ cacheDir, dbPath, fetchJson: refreshedFetch, refresh: true, log });

    expect(refreshedFetch).toHaveBeenCalledTimes(2);
  });

  it('fails and leaves the database untouched when there is no cache and no network', async () => {
    const root = temporaryDir();
    const cacheDir = join(root, 'cache');
    const dbPath = join(root, 'data', 'app.db');

    await expect(
      runImport({
        cacheDir,
        dbPath,
        fetchJson: () => {
          throw new Error('network unavailable');
        },
        log: vi.fn(),
      })
    ).rejects.toThrow();

    expect(existsSync(join(cacheDir, 'products.json'))).toBe(false);
    expect(existsSync(dbPath)).toBe(false);
  });
});
