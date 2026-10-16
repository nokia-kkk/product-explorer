import { z } from 'zod';
import type { Db } from './db';

export const categorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  url: z.string(),
});

export const productSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  description: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  category: z.string().min(1),
  price: z.number(),
  discountPercentage: z
    .number()
    .nullish()
    .transform((value) => value ?? 0),
  rating: z
    .number()
    .nullish()
    .transform((value) => value ?? 0),
  stock: z
    .number()
    .nullish()
    .transform((value) => value ?? 0),
  brand: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  thumbnail: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  images: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
});

export type DummyJSONCategory = z.infer<typeof categorySchema>;
export type DummyJSONProduct = z.infer<typeof productSchema>;

export interface ImportPayload {
  categories: DummyJSONCategory[];
  products: DummyJSONProduct[];
}

export interface ImportSummary {
  categories: number;
  products: number;
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'category';
}

export function importProducts(db: Db, payload: ImportPayload): ImportSummary {
  const categories = categorySchema.array().min(1).parse(payload.categories);
  const products = productSchema.array().parse(payload.products);

  const slugCounts = new Map<string, number>();
  const categorySlug = new Map<string, string>();
  for (const category of categories) {
    const base = slugify(category.name);
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    categorySlug.set(category.slug, count === 0 ? base : `${base}-${count + 1}`);
  }

  db.transaction(() => {
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM categories').run();

    const insertCategory = db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)');
    const categoryId = new Map<string, number>();
    for (const [index, category] of categories.entries()) {
      const categoryIdForCategory = index + 1;
      insertCategory.run(categoryIdForCategory, category.name, categorySlug.get(category.slug)!);
      categoryId.set(category.slug, categoryIdForCategory);
    }

    const insertProduct = db.prepare(
      `INSERT INTO products
        (id, title, description, price, discount_percentage, rating, stock, brand, category_id, thumbnail, images_json)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const product of products) {
      const categoryIdForProduct = categoryId.get(product.category);
      if (categoryIdForProduct === undefined) {
        throw new Error(
          `Product ${product.id} ("${product.title}") references unknown category "${product.category}"`
        );
      }
      insertProduct.run(
        product.id,
        product.title,
        product.description,
        product.price,
        product.discountPercentage,
        product.rating,
        product.stock,
        product.brand,
        categoryIdForProduct,
        product.thumbnail,
        JSON.stringify(product.images)
      );
    }
  })();

  return { categories: categories.length, products: products.length };
}
