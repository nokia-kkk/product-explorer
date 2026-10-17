import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ProductListResponse } from '@shared/types';
import { fetchProducts, fetchCategories } from '../lib/api';
import ProductCard from './ProductCard';
import ProductToolbar from './ProductToolbar';
import Pagination from './Pagination';

const DEFAULTS = { sortBy: 'name', order: 'asc', page: 1, limit: 12 } as const;

type ParsedListParams = {
  q?: string;
  category?: string;
  sortBy: string;
  order: string;
  page: number;
  limit: number;
};

function parseListSearchParams(searchParams: URLSearchParams): ParsedListParams {
  const clampInt = (value: string | null, min: number, fallback: number) => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isInteger(parsed) && parsed >= min ? parsed : fallback;
  };

  const page = clampInt(searchParams.get('page'), 1, DEFAULTS.page);
  const limit = clampInt(searchParams.get('limit'), 1, DEFAULTS.limit);
  return {
    q: searchParams.get('q') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? DEFAULTS.sortBy,
    order: searchParams.get('order') ?? DEFAULTS.order,
    page,
    limit,
  };
}

function paramUpdates(
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

function serializeListParams(params: ParsedListParams): string {
  return [
    params.q ?? '',
    params.category ?? '',
    params.sortBy,
    params.order,
    params.page,
    params.limit,
  ].join('|');
}

type ProductListProps = {
  title: string;
  /**
   * Fixes the category filter to this slug and hides the category select.
   * Used by routes where the category comes from the path.
   */
  lockedCategory?: string;
};

export default function ProductList({ title, lockedCategory }: ProductListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const params = parseListSearchParams(searchParams);
  const category = lockedCategory ?? params.category;

  const onSearchChange = useCallback(
    (q: string) => {
      setSearchParams((previous) => paramUpdates(previous, new URLSearchParams({ q }), true));
    },
    [setSearchParams]
  );

  const onCategoryChange = useCallback(
    (nextCategory: string) => {
      setSearchParams((previous) =>
        paramUpdates(previous, new URLSearchParams({ category: nextCategory }), true)
      );
    },
    [setSearchParams]
  );

  const onSortChange = useCallback(
    (sortBy: string, order: string) => {
      setSearchParams((previous) =>
        paramUpdates(previous, new URLSearchParams({ sortBy, order }), false)
      );
    },
    [setSearchParams]
  );

  const onPageChange = useCallback(
    (page: number) => {
      setSearchParams((previous) =>
        paramUpdates(previous, new URLSearchParams({ page: String(page) }), false)
      );
    },
    [setSearchParams]
  );

  const onClearFilters = useCallback(() => {
    setDismissedKey(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const productsQuery = useQuery<ProductListResponse>({
    queryKey: [
      'products',
      params.q ?? '',
      category ?? '',
      params.sortBy,
      params.order,
      params.page,
      params.limit,
    ],
    queryFn: () =>
      fetchProducts({
        q: params.q,
        category,
        sortBy: params.sortBy,
        order: params.order,
        page: params.page,
        limit: params.limit,
      }),
    placeholderData: (previous) => previous,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const products = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;

  const showError =
    productsQuery.isError && dismissedKey !== serializeListParams({ ...params, category });

  return (
    <section className="flex flex-col gap-6">
      <ProductToolbar
        title={title}
        search={params.q ?? ''}
        category={category ?? ''}
        sortBy={params.sortBy}
        order={params.order}
        categories={categoriesQuery.data?.data ?? []}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onCategoryChange={lockedCategory ? undefined : onCategoryChange}
      />

      {showError && (
        <div
          role="alert"
          data-testid="products-error-banner"
          className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>Failed to load products. Please try again.</span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              data-testid="products-retry"
              className="rounded-md border border-red-300 bg-white px-3 py-1 text-red-700 hover:bg-red-100"
              onClick={() => productsQuery.refetch()}
            >
              Retry
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 font-medium text-red-700 hover:text-red-900"
              onClick={() => setDismissedKey(serializeListParams({ ...params, category }))}
            >
              Dismiss
            </button>
          </span>
        </div>
      )}

      {productsQuery.isPending && (
        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-busy="true"
          aria-label="Loading products"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <li
              key={`skeleton-${index}`}
              data-testid="product-skeleton"
              className="flex flex-col gap-2 overflow-hidden rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="aspect-square w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            </li>
          ))}
        </ul>
      )}

      {!productsQuery.isPending && products.length === 0 && !productsQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-16 text-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-12 w-12 text-gray-400"
          >
            <path strokeLinecap="round" d="M21 21l-5.2-5.2M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">No products found</h2>
          <p className="text-sm text-gray-600">Try adjusting your search or filters.</p>
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            onClick={onClearFilters}
          >
            Clear filters
          </button>
        </div>
      )}

      {products.length > 0 && (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
          {meta && meta.pageCount > 1 && (
            <Pagination page={meta.page} pageCount={meta.pageCount} onPageChange={onPageChange} />
          )}
        </>
      )}
    </section>
  );
}
