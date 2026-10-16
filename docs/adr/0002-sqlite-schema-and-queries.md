# 0002 — SQLite Schema and Query Patterns

**Date**: 2026-10-14
**Status**: Accepted

## Context
Products and categories from DummyJSON need to be stored locally. DummyJSON gives each product a single `category` string. We need efficient search, filter, sort, and pagination entirely in SQL.

## Decision
**Schema**:
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  discount_percentage REAL DEFAULT 0,
  rating REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  brand TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  thumbnail TEXT,
  images_json TEXT  -- JSON array of image URLs
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_title ON products(title);
```

**Query patterns**:
- Search: `WHERE title LIKE ? COLLATE NOCASE` (parameterized)
- Filter: `WHERE category_id = ?`
- Sort: `ORDER BY` via allowlist map (`name→title`, `price→price`, `rating→rating`) + validated `ASC/DESC`
- Pagination: `LIMIT ? OFFSET ?` + separate `SELECT COUNT(*)` for total

**No FTS5** — dataset is ~100 products; `LIKE` is fast enough. Can upgrade later without API changes.

## Consequences
- ✅ Simple, no virtual tables or triggers
- ✅ Parameterized queries prevent SQL injection
- ✅ Allowlist prevents ORDER BY injection
- ⚠️ Case-insensitive search requires `COLLATE NOCASE` (SQLite default for ASCII)
- ⚠️ `product_count` on categories computed via `COUNT(*)` at query time (no denormalization)