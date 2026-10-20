import { describe, it, expect, afterEach } from 'vitest';
import type { Db } from './db.js';
import { getProduct, listProducts, parseProductId, parseProductListQuery } from './products.js';
import { cleanupTemporaryState, temporaryDb } from './testing.js';

afterEach(cleanupTemporaryState);

function seededProductsDb(): Db {
  return temporaryDb((db) => {
    const insertCategory = db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)');
    const insertProduct = db.prepare(
      `INSERT INTO products
        (id, title, price, discount_percentage, rating, brand, category_id, thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    insertCategory.run(1, 'Beauty', 'beauty');
    insertCategory.run(2, 'Groceries', 'groceries');

    insertProduct.run(1, 'Lipstick Red', 12.5, 20, 4.5, 'Chic', 1, 'thumb-1.jpg');
    insertProduct.run(2, 'Powder Canister', 14.99, 0, 4.7, 'Powdal', 1, 'thumb-2.jpg');
    insertProduct.run(3, 'Tal Bowl', 17.99, 5, 4.9, 'Green', 2, 'thumb-3.jpg');
    insertProduct.run(4, 'Egg White', 9.49, 10, 4.2, 'Farm', 2, 'thumb-4.jpg');
  });
}

describe('listProducts', () => {
  it('returns the first page with default paging and accurate metadata', () => {
    const db = seededProductsDb();

    const response = listProducts(db, {});

    expect(response.meta).toEqual({ total: 4, page: 1, limit: 20, pageCount: 1 });
    expect(response.data).toHaveLength(4);
    expect(response.data[0]).toEqual({
      id: 4,
      title: 'Egg White',
      price: 9.49,
      discountPercentage: 10,
      rating: 4.2,
      thumbnail: 'thumb-4.jpg',
      brand: 'Farm',
      category: 'Groceries',
      categorySlug: 'groceries',
    });
  });

  it('searches titles case-insensitively with q', () => {
    const db = seededProductsDb();

    const response = listProducts(db, { q: 'EGG' });

    expect(response.meta).toEqual({ total: 1, page: 1, limit: 20, pageCount: 1 });
    expect(response.data.map((p) => p.title)).toEqual(['Egg White']);
  });

  it('filters by category slug', () => {
    const db = seededProductsDb();

    const response = listProducts(db, { category: 'beauty' });

    expect(response.meta).toEqual({ total: 2, page: 1, limit: 20, pageCount: 1 });
    expect(response.data.map((p) => p.title).sort()).toEqual(['Lipstick Red', 'Powder Canister']);
  });

  it('combines search and category filter', () => {
    const db = seededProductsDb();

    const response = listProducts(db, { q: 'egg', category: 'beauty' });

    expect(response.data).toEqual([]);
    expect(response.meta.total).toBe(0);
  });

  it('returns empty data with zero total for an unknown category slug', () => {
    const db = seededProductsDb();

    const response = listProducts(db, { category: 'no-such-category' });

    expect(response.data).toEqual([]);
    expect(response.meta).toEqual({ total: 0, page: 1, limit: 20, pageCount: 0 });
  });

  it('sorts by price descending', () => {
    const db = seededProductsDb();

    const response = listProducts(db, { sortBy: 'price', order: 'desc' });

    expect(response.data.map((p) => p.title)).toEqual([
      'Tal Bowl',
      'Powder Canister',
      'Lipstick Red',
      'Egg White',
    ]);
  });

  it('sorts by rating ascending', () => {
    const db = seededProductsDb();

    const response = listProducts(db, { sortBy: 'rating' });

    expect(response.data.map((p) => p.rating)).toEqual([4.2, 4.5, 4.7, 4.9]);
  });

  it('breaks sort ties deterministically by product id', () => {
    const db = seededProductsDb();
    db.prepare(
      'INSERT INTO products (id, title, price, discount_percentage, rating, brand, category_id, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(5, 'Egg Yolk', 9.49, 10, 4.2, 'Farm', 2, 'thumb-5.jpg');

    const response = listProducts(db, { sortBy: 'rating', limit: 2 });

    expect(response.data.map((p) => p.title)).toEqual(['Egg White', 'Egg Yolk']);
  });

  it('paginates with page and limit', () => {
    const db = seededProductsDb();

    const page1 = listProducts(db, { page: 1, limit: 2 });
    const page2 = listProducts(db, { page: 2, limit: 2 });

    expect(page1.meta).toEqual({ total: 4, page: 1, limit: 2, pageCount: 2 });
    expect(page1.data.map((p) => p.title)).toEqual(['Egg White', 'Lipstick Red']);
    expect(page2.data.map((p) => p.title)).toEqual(['Powder Canister', 'Tal Bowl']);
  });

  it('returns empty data with correct meta for an out-of-range page', () => {
    const db = seededProductsDb();

    const response = listProducts(db, { page: 99, limit: 2 });

    expect(response.data).toEqual([]);
    expect(response.meta).toEqual({ total: 4, page: 99, limit: 2, pageCount: 2 });
  });

  it('treats % and _ in the search term literally', () => {
    const db = seededProductsDb();

    expect(listProducts(db, { q: '%White' }).data).toEqual([]);
    expect(listProducts(db, { q: 'Egg_White' }).data).toEqual([]);
    expect(listProducts(db, { q: 'Egg' }).data.map((p) => p.title)).toEqual(['Egg White']);
  });

  it('finds a title containing a quote, because the term is bound not spliced', () => {
    const db = seededProductsDb();
    db.prepare('INSERT INTO products (id, title, price, category_id) VALUES (?, ?, ?, ?)').run(
      9,
      "Children's Talc",
      4.25,
      1
    );

    expect(listProducts(db, { q: "Children's" }).data.map((p) => p.title)).toEqual([
      "Children's Talc",
    ]);
    expect(listProducts(db, { category: "beauty' OR '1'='1" }).data).toEqual([]);
  });
});

describe('getProduct', () => {
  /** A product with every column populated, plus the category name it joins to. */
  function detailedDb(): Db {
    const db = seededProductsDb();
    db.prepare(
      `INSERT INTO products
        (id, title, description, price, discount_percentage, rating, stock, brand, category_id, thumbnail, images_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      10,
      'Essence Mascara Lash Princess',
      'A volumising mascara.',
      9.99,
      7.17,
      4.94,
      99,
      'Essence',
      1,
      'thumb-10.jpg',
      JSON.stringify(['img-a.jpg', 'img-b.jpg'])
    );
    return db;
  }

  it('returns the full product with its category name and parsed images', () => {
    const db = detailedDb();

    expect(getProduct(db, 10)).toEqual({
      id: 10,
      title: 'Essence Mascara Lash Princess',
      description: 'A volumising mascara.',
      price: 9.99,
      discountPercentage: 7.17,
      rating: 4.94,
      stock: 99,
      brand: 'Essence',
      category: 'Beauty',
      thumbnail: 'thumb-10.jpg',
      images: ['img-a.jpg', 'img-b.jpg'],
    });
  });

  it('returns null for an unknown id', () => {
    const db = detailedDb();

    expect(getProduct(db, 9999)).toBeNull();
  });

  it('defaults null description and images to empty values', () => {
    const db = seededProductsDb();

    // seededProductsDb inserts omit description and images_json entirely.
    expect(getProduct(db, 1)).toMatchObject({
      description: '',
      images: [],
    });
  });
});

describe('parseProductId', () => {
  it('accepts a positive integer, including a numeric string', () => {
    expect(parseProductId('42')).toBe(42);
    expect(parseProductId('1')).toBe(1);
  });

  it('rejects anything that is not a positive integer', () => {
    for (const input of ['abc', '0', '-1', '1.5', '', '1e3', ' 1', '1 ', 'Infinity']) {
      expect(parseProductId(input), JSON.stringify(input)).toBeNull();
    }
  });
});

describe('seam integration', () => {
  it('feeds parsed params straight into listProducts', () => {
    const db = seededProductsDb();
    const parsed = parseProductListQuery({
      q: 'egg',
      category: 'groceries',
      sortBy: 'price',
      order: 'desc',
      page: '1',
      limit: '10',
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const response = listProducts(db, parsed.params);
      expect(response.data.map((p) => p.title)).toEqual(['Egg White']);
      expect(response.meta).toEqual({ total: 1, page: 1, limit: 10, pageCount: 1 });
    }
  });
});

describe('parseProductListQuery', () => {
  it('applies safe defaults to an empty query', () => {
    expect(parseProductListQuery({})).toEqual({
      ok: true,
      params: { sortBy: 'name', order: 'asc', page: 1, limit: 20 },
    });
  });

  it('coerces numeric query strings and keeps valid values', () => {
    const parsed = parseProductListQuery({ page: '2', limit: '50' });
    expect(parsed).toEqual({
      ok: true,
      params: { sortBy: 'name', order: 'asc', page: 2, limit: 50 },
    });
  });

  it('rejects malformed values with an error per issue', () => {
    const sample: [unknown, string][] = [
      [{ q: ['a', 'b'] }, 'q'],
      [{ category: 'Not a slug!' }, 'category'],
      [{ sortBy: 'brand' }, 'sortBy'],
      [{ order: 'down' }, 'order'],
      [{ page: '0' }, 'page'],
      [{ page: 'abc' }, 'page'],
      [{ limit: '0' }, 'limit'],
      [{ limit: '101' }, 'limit'],
    ];
    for (const [input, field] of sample) {
      const parsed = parseProductListQuery(input);
      expect(parsed.ok, JSON.stringify(input)).toBe(false);
      if (!parsed.ok) expect(parsed.errors.join(' ')).toContain(field);
    }
  });

  it('treats an explicitly empty q or category as "no value"', () => {
    const noFilter = { ok: true, params: { sortBy: 'name', order: 'asc', page: 1, limit: 20 } };
    expect(parseProductListQuery({ q: '' })).toEqual(noFilter);
    expect(parseProductListQuery({ category: '' })).toEqual(noFilter);
    expect(parseProductListQuery({ q: '', category: '' })).toEqual(noFilter);
  });

  it('rejects SQL fragments and non-slug values for every operator field', () => {
    const injection = "'; DROP TABLE products; --";
    for (const field of ['category', 'sortBy', 'order', 'page', 'limit']) {
      const parsed = parseProductListQuery({ [field]: injection });
      expect(parsed.ok, field).toBe(false);
    }
  });

  it('accepts only the documented operators', () => {
    for (const sortBy of ['name', 'price', 'rating']) {
      expect(parseProductListQuery({ sortBy })).toMatchObject({ ok: true, params: { sortBy } });
    }
    for (const order of ['asc', 'desc']) {
      expect(parseProductListQuery({ order })).toMatchObject({ ok: true, params: { order } });
    }
  });
});
