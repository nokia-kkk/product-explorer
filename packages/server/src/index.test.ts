import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import type { Db } from './db.js';
import { createApp } from './index.js';
import { cleanupTemporaryState, seedCatalog, temporaryDb, temporaryDir } from './testing.js';

let db: Db;
let app: Express;

beforeEach(() => {
  db = temporaryDb(seedCatalog);
  app = createApp(db);
});

afterEach(cleanupTemporaryState);

describe('GET /api/products', () => {
  it('returns the first page with default paging and accurate metadata', async () => {
    const response = await request(app).get('/api/products').expect(200);

    expect(response.body.meta).toEqual({ total: 4, page: 1, limit: 20, pageCount: 1 });
    expect(response.body.data).toHaveLength(4);
    expect(response.body.data[0]).toMatchObject({ title: 'Egg White', category: 'Groceries' });
  });

  it('rejects an invalid sortBy, order, page, or limit with 400 and a per-field error', async () => {
    const invalid: [string, string][] = [
      ['sortBy=brand', 'sortBy'],
      ['order=down', 'order'],
      ['page=0', 'page'],
      ['limit=0', 'limit'],
      ['limit=101', 'limit'],
    ];

    for (const [query, field] of invalid) {
      const response = await request(app).get(`/api/products?${query}`).expect(400);
      expect(response.body.error).toBe('Invalid query parameters');
      expect(response.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(new RegExp(`^${field}: `))])
      );
    }
  });

  it('searches, filters, sorts, and paginates through the query string', async () => {
    const search = await request(app).get('/api/products?q=egg').expect(200);
    expect(search.body.data.map((p: { title: string }) => p.title)).toEqual(['Egg White']);

    const filtered = await request(app).get('/api/products?category=beauty').expect(200);
    expect(filtered.body.meta.total).toBe(2);

    const sorted = await request(app)
      .get('/api/products?sortBy=price&order=desc&limit=2')
      .expect(200);
    expect(sorted.body.data.map((p: { title: string }) => p.title)).toEqual([
      'Tal Bowl',
      'Powder Canister',
    ]);

    const page2 = await request(app).get('/api/products?page=2&limit=2').expect(200);
    expect(page2.body.meta).toEqual({ total: 4, page: 2, limit: 2, pageCount: 2 });
    expect(page2.body.data.map((p: { title: string }) => p.title)).toEqual([
      'Powder Canister',
      'Tal Bowl',
    ]);
  });

  it('returns an empty page with honest metadata when the page is out of range', async () => {
    const response = await request(app).get('/api/products?page=99&limit=2').expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toEqual({ total: 4, page: 99, limit: 2, pageCount: 2 });
  });

  it('survives SQL metacharacters in search, filter, sort, and page without touching the data', async () => {
    const injection = encodeURIComponent("'; DROP TABLE products; --");

    await request(app).get(`/api/products?q=${injection}`).expect(200);
    await request(app).get(`/api/products?category=${injection}`).expect(400);
    await request(app).get(`/api/products?sortBy=${injection}`).expect(400);
    await request(app).get(`/api/products?page=${injection}`).expect(400);

    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 4 });
    expect((await request(app).get('/api/products').expect(200)).body.meta.total).toBe(4);
  });
});

describe('GET /api/categories', () => {
  it('returns every category with its product count, including empty ones', async () => {
    const response = await request(app).get('/api/categories').expect(200);

    expect(response.body).toEqual({
      data: [
        { id: 3, name: 'Accessories', slug: 'accessories', productCount: 0 },
        { id: 1, name: 'Beauty', slug: 'beauty', productCount: 2 },
        { id: 2, name: 'Groceries', slug: 'groceries', productCount: 2 },
      ],
      meta: { total: 3 },
    });
  });
});

describe('production static hosting', () => {
  let clientDir: string;

  beforeEach(() => {
    clientDir = temporaryDir('miniapp-client-');
    writeFileSync(join(clientDir, 'index.html'), '<!doctype html><title>MiniApp</title>');
    writeFileSync(join(clientDir, 'app.js'), 'console.log("built")');
  });

  it('serves the built index.html at the site root', async () => {
    const response = await request(createApp(db, clientDir)).get('/').expect(200);
    expect(response.text).toContain('<title>MiniApp</title>');
  });

  it('serves built assets', async () => {
    const response = await request(createApp(db, clientDir)).get('/app.js').expect(200);
    expect(response.text).toBe('console.log("built")');
  });

  it('falls back to index.html so client routes deep-link and reload', async () => {
    const response = await request(createApp(db, clientDir)).get('/products/7').expect(200);
    expect(response.text).toContain('<title>MiniApp</title>');
  });

  it('still answers unknown API routes with JSON, not the app shell', async () => {
    for (const path of ['/api/nope', '/api', '/API/nope', '/api/products/7/extra']) {
      const response = await request(createApp(db, clientDir)).get(path).expect(404);
      expect(response.body).toEqual({ error: 'Not found' });
    }
  });

  it('answers a missing asset with 404 rather than the shell, which would fail as HTML', async () => {
    await request(createApp(db, clientDir)).get('/assets/gone.js').expect(404);
  });

  it('serves only the API when no client directory is configured', async () => {
    await request(createApp(db)).get('/').expect(404);
  });
});
