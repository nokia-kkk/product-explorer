import { useCallback, useState } from 'react';
import { useCategories } from '../../categories/hooks/useCategories';
import { useProductListParams } from '../hooks/useProductListParams';
import { useProducts } from '../hooks/useProducts';
import { listParamsToQuery, serializeListParams } from '../lib/listParams';
import { Pagination } from './Pagination';
import { ProductGrid } from './ProductGrid';
import { ProductListEmpty } from './ProductListEmpty';
import { ProductListError } from './ProductListError';
import { ProductListSkeleton } from './ProductListSkeleton';
import { ProductToolbar } from './ProductToolbar';

type ProductBrowserProps = {
  title: string;
  /**
   * Fixes the category from the route, e.g. `/categories/:slug`, and hides the
   * category filter because the path already decides it.
   */
  lockedCategory?: string;
};

/**
 * The product listing: toolbar, loading/error/empty states, grid and pagination.
 * Owns the data and URL wiring; the pieces below it are presentational.
 */
export function ProductBrowser({ title, lockedCategory }: ProductBrowserProps) {
  const { params, category, setSearch, setCategory, setSort, setPage, clearFilters } =
    useProductListParams(lockedCategory);
  const categories = useCategories();
  const products = useProducts(listParamsToQuery(params, category));

  // A dismissed banner stays dismissed only for the params it was dismissed for,
  // so changing filters (and failing again) surfaces a fresh one.
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const currentKey = serializeListParams({ ...params, category });

  const showError = products.isError && dismissedKey !== currentKey;

  const handleClearFilters = useCallback(() => {
    setDismissedKey(null);
    clearFilters();
  }, [clearFilters]);

  return (
    <section className="flex flex-col gap-6">
      <ProductToolbar
        title={title}
        search={params.q ?? ''}
        category={category ?? ''}
        sortBy={params.sortBy}
        order={params.order}
        categories={categories.data}
        total={products.meta?.total}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onCategoryChange={lockedCategory ? undefined : setCategory}
      />

      {showError && (
        <ProductListError
          onRetry={() => products.refetch()}
          onDismiss={() => setDismissedKey(currentKey)}
        />
      )}

      {products.isLoading && <ProductListSkeleton count={8} />}

      {!products.isLoading && !products.isError && products.data.length === 0 && (
        <ProductListEmpty onClearFilters={handleClearFilters} />
      )}

      {products.data.length > 0 && <ProductGrid products={products.data} />}

      {/* Kept outside the results block so an out-of-range page still shows its
          position ("Page 999 of 10") next to the empty state. */}
      {products.meta && products.meta.pageCount > 1 && (
        <Pagination
          page={products.meta.page}
          pageCount={products.meta.pageCount}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
