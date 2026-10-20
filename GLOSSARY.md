# Glossary

## Product
A sellable item with properties: id, title, description, price, discountPercentage, rating, stock, brand, category, thumbnail, images[].
Sourced from DummyJSON and stored in SQLite.

ListItem form (`GET /api/products`): the fields needed for a card, plus `categorySlug` so a card can link to its category without deriving the slug. The detail form carries no `categorySlug`.

## Category
A classification for products. Properties: id, name, slug (derived from name), productCount (computed).
Each product belongs to exactly one category (per DummyJSON structure).

## ProductListResponse
API response for product listing:
```ts
{
  data: ProductListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}
```

## ProductDetailResponse
API response for a single product (`GET /api/products/:id`):
```ts
{ data: Product }
```
An unknown or non-numeric id is an error, not an empty payload: 404 `{ error: 'Product not found' }`
or 400 `{ error: 'Invalid product id' }`.

## CategoryListResponse
API response for category listing:
```ts
{
  data: CategoryWithCount[];
  meta: { total: number };
}
```

## Import
The one-time (repeatable) process of fetching products and categories from DummyJSON and populating the local SQLite database.
Run via `npm run import`. Caches raw JSON locally for offline re-runs.
Transactional: all-or-nothing; safe to re-run.

## URL State
The source of truth for product listing filters and pagination.
Parameters: `q` (search), `category` (filter), `sortBy`, `order`, `page`, `limit`.
Changes to these params drive TanStack Query refetches.
Browser refresh, shared URLs, and back/forward navigation restore exact state.

## Server-Side Operations
Search, filtering, sorting, and pagination are performed entirely in SQLite.
The API returns only the requested page with accurate metadata.
No client-side filtering/sorting of full datasets.

## DummyJSON
External product data source (https://dummyjson.com).
Used only during import. Never contacted during normal application runtime.
