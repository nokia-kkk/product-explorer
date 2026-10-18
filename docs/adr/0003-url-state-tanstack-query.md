# 0003 — URL as Source of Truth with TanStack Query

**Date**: 2026-10-14
**Status**: Accepted

## Context
Product listing state (search, filter, sort, pagination) must survive refresh, sharing, and browser navigation. No localStorage/sessionStorage for app state.

## Decision
- **URL owns all listing state**: `q`, `category`, `sortBy`, `order`, `page`, `limit` as query parameters
- **TanStack Query keys mirror URL params, in object form**:
  `['products', 'list', { q, category, sortBy, order, page, limit }]`.
  Keys are built only by `features/*/api/queryKeys.ts` — never written inline — and the
  `list`/`detail` segment lets `['products']` invalidate the whole feature by prefix.
  Object form rather than a positional array, so a key cannot break by reordering
- **React Router `useSearchParams`** reads/writes URL
- **Search/category change → reset page to 1** via `searchParams.set('page', '1')`
- **Invalid page (e.g., 999 of 5)**: Server returns empty data + correct meta; client shows empty state, pagination shows "Page 999 of 5"
- **No duplicate state**: No React state for filters; URL is the single source

## Consequences
- ✅ Shareable, bookmarkable, refreshable URLs
- ✅ Browser back/forward works naturally
- ✅ TanStack Query caching keyed by URL params (automatic deduping)
- ⚠️ Must handle param validation on server (400 for malformed)
- ⚠️ Category filter on `/categories/:slug` comes from path, not query param