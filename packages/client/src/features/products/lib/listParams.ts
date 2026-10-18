import { type ProductSortField, type SortOrder } from '@miniapp/shared';
import type { ProductListQuery } from '../api/products';

/**
 * The listing defaults. These are deliberately NOT written to the URL — a clean
 * `/?q=jacket` is nicer to share than `/?q=jacket&sortBy=name&order=asc&page=1&limit=12`
 * — but they ARE always sent in the API request, so the listing never depends on
 * the server's own defaults.
 *
 * The page size is a client choice, so it lives here rather than in @miniapp/shared.
 */
export const LIST_DEFAULTS = {
  sortBy: 'name',
  order: 'asc',
  page: 1,
  limit: 12,
} as const;

/** A fully-resolved set of listing parameters, with defaults filled in. */
export type ProductListParams = {
  q?: string;
  category?: string;
  sortBy: ProductSortField;
  order: SortOrder;
  page: number;
  limit: number;
};

/** Reads a positive integer from a param, falling back when absent or malformed. */
function parseIntParam(value: string | null, min: number, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed >= min ? parsed : fallback;
}

function isSortField(value: string): value is ProductSortField {
  return value === 'name' || value === 'price' || value === 'rating';
}

function isSortOrder(value: string): value is SortOrder {
  return value === 'asc' || value === 'desc';
}

/** Reads listing params out of the URL, applying defaults for anything absent or invalid. */
export function parseListSearchParams(searchParams: URLSearchParams): ProductListParams {
  const sortBy = searchParams.get('sortBy') ?? LIST_DEFAULTS.sortBy;
  const order = searchParams.get('order') ?? LIST_DEFAULTS.order;

  return {
    q: searchParams.get('q') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    sortBy: isSortField(sortBy) ? sortBy : LIST_DEFAULTS.sortBy,
    order: isSortOrder(order) ? order : LIST_DEFAULTS.order,
    page: parseIntParam(searchParams.get('page'), 1, LIST_DEFAULTS.page),
    limit: parseIntParam(searchParams.get('limit'), 1, LIST_DEFAULTS.limit),
  };
}

/**
 * Applies `updates` to `searchParams`. An empty value deletes the key, so a
 * bare `?q=` never survives. `resetPage` drops back to page 1 — used by the
 * filters that change the result set, but not by sorting or paging, which
 * leave the caller where they were.
 */
export function paramUpdates(
  searchParams: URLSearchParams,
  updates: URLSearchParams,
  resetPage: boolean
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  updates.forEach((value, key) => {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  });
  if (resetPage) next.delete('page');
  return next;
}

/** A stable identity for a set of params, used to tell one failed query from the next. */
export function serializeListParams(params: ProductListParams): string {
  return [
    params.q ?? '',
    params.category ?? '',
    params.sortBy,
    params.order,
    params.page,
    params.limit,
  ].join('|');
}

/** The API request for a set of params. `category` is passed separately because a
 *  route such as `/categories/:slug` fixes it from the path, overriding the URL param. */
export function listParamsToQuery(params: ProductListParams, category?: string): ProductListQuery {
  return {
    q: params.q,
    category,
    sortBy: params.sortBy,
    order: params.order,
    page: params.page,
    limit: params.limit,
  };
}
