import { describe, it, expect, afterEach } from 'vitest';
import { importProducts } from './import.js';
import { cleanupTemporaryState, temporaryDb } from './testing.js';

afterEach(cleanupTemporaryState);

const categories = [
  { slug: 'beauty', name: 'Beauty', url: 'https://dummyjson.com/products/category/beauty' },
  {
    slug: 'skin-care',
    name: 'Skin Care',
    url: 'https://dummyjson.com/products/category/skin-care',
  },
];

const products = [
  {
    id: 1,
    title: 'Essence Mascara Lash Princess',
    description: 'Volumizing and lengthening mascara.',
    category: 'beauty',
    price: 9.99,
    discountPercentage: 10.48,
    rating: 2.56,
    stock: 99,
    brand: 'Essence',
    thumbnail: 'https://cdn.dummyjson.com/thumbnail.webp',
    images: ['https://cdn.dummyjson.com/1.webp', 'https://cdn.dummyjson.com/2.webp'],
  },
];

describe('importProducts', () => {
  it('imports categories with derived slugs and linked products in one transaction', () => {
    const db = temporaryDb();

    const summary = importProducts(db, { categories, products });

    expect(summary).toEqual({ categories: 2, products: 1 });
    expect(db.prepare('SELECT name, slug FROM categories ORDER BY slug').all()).toEqual([
      { name: 'Beauty', slug: 'beauty' },
      { name: 'Skin Care', slug: 'skin-care' },
    ]);
    const category = db.prepare('SELECT id FROM categories WHERE name = ?').get('Beauty') as {
      id: number;
    };
    const product = db.prepare('SELECT * FROM products WHERE id = 1').get() as Record<
      string,
      unknown
    >;
    expect(product.category_id).toBe(category.id);
    expect(product.discount_percentage).toBe(10.48);
    expect(product.stock).toBe(99);
    expect(product.brand).toBe('Essence');
    expect(JSON.parse(product.images_json as string)).toEqual([
      'https://cdn.dummyjson.com/1.webp',
      'https://cdn.dummyjson.com/2.webp',
    ]);
  });

  it('replaces previously imported data completely', () => {
    const db = temporaryDb();
    db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(
      42,
      'Stale Category',
      'stale-category'
    );
    db.prepare('INSERT INTO products (id, title, price, category_id) VALUES (?, ?, ?, ?)').run(
      7,
      'Stale Product',
      1,
      42
    );

    importProducts(db, { categories, products });

    expect(
      db.prepare('SELECT name, slug FROM categories WHERE name = ?').get('Stale Category')
    ).toBeUndefined();
    expect(db.prepare('SELECT id FROM products WHERE id = 7').get()).toBeUndefined();
    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 1 });
  });

  it('rolls back and leaves the existing data intact when the import fails', () => {
    const db = temporaryDb();
    db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(
      42,
      'Stale Category',
      'stale-category'
    );
    db.prepare('INSERT INTO products (id, title, price, category_id) VALUES (?, ?, ?, ?)').run(
      7,
      'Stale Product',
      1,
      42
    );

    const duplicateProducts = [products[0], { ...products[0], title: 'Duplicate Mascara' }];

    expect(() => importProducts(db, { categories, products: duplicateProducts })).toThrow();
    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 1 });
    expect(db.prepare('SELECT title FROM products WHERE id = 7').get()).toEqual({
      title: 'Stale Product',
    });
    expect(db.prepare('SELECT name FROM categories WHERE id = 42').get()).toEqual({
      name: 'Stale Category',
    });
  });

  it('is idempotent: re-importing the same payload produces identical rows', () => {
    const db = temporaryDb();

    const first = importProducts(db, { categories, products });
    const afterFirst = db
      .prepare('SELECT id, title, price, category_id FROM products ORDER BY id')
      .all();
    const firstCategories = db.prepare('SELECT name, slug FROM categories ORDER BY slug').all();

    const second = importProducts(db, { categories, products });
    expect(second).toEqual(first);
    expect(
      db.prepare('SELECT id, title, price, category_id FROM products ORDER BY id').all()
    ).toEqual(afterFirst);
    expect(db.prepare('SELECT name, slug FROM categories ORDER BY slug').all()).toEqual(
      firstCategories
    );
    expect(db.prepare('SELECT COUNT(*) AS count FROM categories').get()).toEqual({
      count: categories.length,
    });
  });

  it('rejects a product whose category is not part of the payload', () => {
    const db = temporaryDb();

    expect(() =>
      importProducts(db, {
        categories,
        products: [{ ...products[0], category: 'laptops' }],
      })
    ).toThrow(/unknown category "laptops"/i);

    expect(db.prepare('SELECT COUNT(*) AS count FROM categories').get()).toEqual({ count: 0 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM products').get()).toEqual({ count: 0 });
  });
});
