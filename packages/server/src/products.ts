import { z } from 'zod';
import type { Db } from './db.js';
import type { Product, ProductListResponse } from '@miniapp/shared';

export type ProductListParams = Partial<ParsedProductListQuery>;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ParsedProductListQuery = {
  q?: string;
  category?: string;
  sortBy: 'name' | 'price' | 'rating';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
};

export const DEFAULT_QUERY = {
  sortBy: 'name',
  order: 'asc',
  page: 1,
  limit: 20,
} as const;

const querySchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().regex(slugPattern).max(120).optional(),
  sortBy: z.enum(['name', 'price', 'rating']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ParseResult =
  { ok: true; params: ParsedProductListQuery } | { ok: false; errors: string[] };

function stripEmptyValues(query: unknown): unknown {
  if (typeof query !== 'object' || query === null) return query;
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== ''));
}

export function parseProductListQuery(query: unknown): ParseResult {
  const result = querySchema.safeParse(stripEmptyValues(query));
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  }
  const {
    q,
    category,
    sortBy = DEFAULT_QUERY.sortBy,
    order = DEFAULT_QUERY.order,
    page = DEFAULT_QUERY.page,
    limit = DEFAULT_QUERY.limit,
  } = result.data;
  return {
    ok: true,
    params: { q, category, sortBy, order, page, limit },
  };
}

const SORT_COLUMNS: Record<ParsedProductListQuery['sortBy'], string> = {
  name: 'p.title',
  price: 'p.price',
  rating: 'p.rating',
};

export function listProducts(db: Db, params: ProductListParams): ProductListResponse {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.q !== undefined && params.q !== '') {
    conditions.push("p.title LIKE ? COLLATE NOCASE ESCAPE '\\'");
    values.push(`%${params.q.replace(/[\\%_]/g, '\\$&')}%`);
  }

  if (params.category !== undefined && params.category !== '') {
    conditions.push('p.category_id = (SELECT id FROM categories WHERE slug = ?)');
    values.push(params.category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortBy = SORT_COLUMNS[params.sortBy ?? DEFAULT_QUERY.sortBy];
  const order = params.order === 'desc' ? 'DESC' : 'ASC';
  const page = params.page ?? DEFAULT_QUERY.page;
  const limit = params.limit ?? DEFAULT_QUERY.limit;
  const offset = (page - 1) * limit;

  const total = (
    db.prepare(`SELECT COUNT(*) AS count FROM products p ${where}`).get(...values) as {
      count: number;
    }
  ).count;

  const data = db
    .prepare(
      `SELECT
        p.id,
        p.title,
        p.price,
        p.discount_percentage AS discountPercentage,
        p.rating,
        p.thumbnail,
        p.brand,
        c.name AS category
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${where}
      ORDER BY ${sortBy} ${order}, p.id ASC
      LIMIT ? OFFSET ?`
    )
    .all(...values, limit, offset) as ProductListResponse['data'];

  return {
    data,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
  };
}

/** Parses a `:id` path segment, returning null for anything that is not a positive integer. */
export function parseProductId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

type ProductRow = Omit<Product, 'images'> & { images_json: string | null };

export function getProduct(db: Db, id: number): Product | null {
  const row = db
    .prepare(
      `SELECT
        p.id,
        p.title,
        COALESCE(p.description, '') AS description,
        p.price,
        p.discount_percentage AS discountPercentage,
        p.rating,
        p.stock,
        COALESCE(p.brand, '') AS brand,
        c.name AS category,
        COALESCE(p.thumbnail, '') AS thumbnail,
        p.images_json
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?`
    )
    .get(id) as ProductRow | undefined;

  if (row === undefined) return null;

  const { images_json: imagesJson, ...product } = row;
  return { ...product, images: imagesJson === null ? [] : (JSON.parse(imagesJson) as string[]) };
}
