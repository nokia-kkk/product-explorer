import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductSortField, SortOrder } from '@miniapp/shared';
import { parseListSearchParams, paramUpdates, type ProductListParams } from '../lib/listParams';

export type UseProductListParamsResult = {
  params: ProductListParams;
  /** The category in effect — a route-locked slug wins over the `category` URL param. */
  category: string | undefined;
  setSearch: (q: string) => void;
  setCategory: (category: string) => void;
  setSort: (sortBy: ProductSortField, order: SortOrder) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
};

/**
 * The single source of truth for the listing's URL state. The URL owns search,
 * filter, sort and pagination, so refresh, sharing and back/forward all restore
 * exactly what was on screen.
 *
 * Changing the search term or the category resets to page 1, because they change
 * the result set. Sorting and paging deliberately keep the current page: sorting
 * reorders what you are looking at, and paging is an explicit move.
 *
 * @param lockedCategory Fixes the category from the route, e.g. `/categories/:slug`,
 *   overriding the URL param.
 */
export function useProductListParams(lockedCategory?: string): UseProductListParamsResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => parseListSearchParams(searchParams), [searchParams]);
  const category = lockedCategory ?? params.category;

  const setSearch = useCallback(
    (q: string) => {
      setSearchParams((previous) => paramUpdates(previous, new URLSearchParams({ q }), true));
    },
    [setSearchParams]
  );

  const setCategory = useCallback(
    (nextCategory: string) => {
      setSearchParams((previous) =>
        paramUpdates(previous, new URLSearchParams({ category: nextCategory }), true)
      );
    },
    [setSearchParams]
  );

  const setSort = useCallback(
    (sortBy: ProductSortField, order: SortOrder) => {
      setSearchParams((previous) =>
        paramUpdates(previous, new URLSearchParams({ sortBy, order }), false)
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((previous) =>
        paramUpdates(previous, new URLSearchParams({ page: String(page) }), false)
      );
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { params, category, setSearch, setCategory, setSort, setPage, clearFilters };
}
