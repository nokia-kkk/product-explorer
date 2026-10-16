# 0004 — Import Process: Transactional, Repeatable, Offline-Capable

**Date**: 2026-10-14
**Status**: Accepted

## Context
Products and categories must be imported from DummyJSON into SQLite. The import must be safe to re-run, work offline after first run, and not leave the database in a partial state on failure.

## Decision
**Command**: `npm run import` (runs `scripts/import.ts` via `tsx`)

**Flow**:
1. Check `data/dummyjson-cache/products.json` and `categories.json` exist
2. If not, fetch from `https://dummyjson.com/products?limit=0` and `/products/categories`
3. Save raw JSON to cache directory
4. Parse and transform to DB rows
5. Single SQLite transaction:
   - `DELETE FROM products`
   - `DELETE FROM categories`
   - `INSERT INTO categories ...`
   - `INSERT INTO products ...`
6. Commit or rollback on any error
7. Log summary: "Imported 20 categories, 100 products in 1.2s"

**Idempotency**:
- `UNIQUE(id)` on both tables (DummyJSON provides stable IDs)
- `DELETE` + `INSERT` in same transaction = atomic replace
- Re-running with cached JSON = identical result, no network

**Offline**: After first successful import, cache exists → `npm run import` works without internet.

## Consequences
- ✅ Atomic: DB never left half-imported
- ✅ Repeatable: same command, same result
- ✅ Offline-capable after first run
- ✅ No server startup dependency on internet
- ⚠️ Must run `npm run import` before first `npm run dev`
- ⚠️ Cache directory (`data/dummyjson-cache/`) must be in `.gitignore`