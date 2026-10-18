import { useQuery } from '@tanstack/react-query';
import type { ProductListItem, ProductListResponse } from '@miniapp/shared';
import { fetchProducts, type ProductListQuery } from '../api/products';
import { productKeys } from '../api/queryKeys';

export type ProductListMeta = ProductListResponse['meta'];

export type UseProductsResult = {
  data: ProductListItem[];
  meta: ProductListMeta | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Loads one page of products. Keeps the previous page on screen while the next
 * one loads (`placeholderData`), so paging and re-sorting don't blank the grid.
 */
export function useProducts(query: ProductListQuery): UseProductsResult {
  const result = useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => fetchProducts(query),
    placeholderData: (previous) => previous,
  });

  return {
    data: result.data?.data ?? [],
    meta: result.data?.meta,
    isLoading: result.isPending,
    isError: result.isError,
    error: result.error ?? null,
    refetch: result.refetch,
  };
}
