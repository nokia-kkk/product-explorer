import { describe, it, expect, afterEach, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDatabase } from '../src/db';
import { runImport } from './import';
import { productSchema, categorySchema } from '../src/import';
import type { z } from 'zod';

const temporaryDirs: string[] = [];

function temporaryDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'miniapp-import-cli-'));
  temporaryDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop()!, { recursive: true, force: true });
  }
});

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
