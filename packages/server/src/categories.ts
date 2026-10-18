import type { Db } from './db.js';
import type { CategoryListResponse } from '@miniapp/shared';

export function listCategories(db: Db): CategoryListResponse {
  const data = db
    .prepare(
      `SELECT
        c.id,
        c.name,
        c.slug,
        COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC`
    )
    .all() as CategoryListResponse['data'];

  return {
    data,
    meta: {
      total: data.length,
    },
  };
}
