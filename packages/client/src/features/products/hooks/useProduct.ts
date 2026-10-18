import { useQuery } from '@tanstack/react-query';
import type { Product } from '@miniapp/shared';
import { fetchProduct } from '../api/products';
import { productKeys } from '../api/queryKeys';

export type UseProductResult = {
  data: Product | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

/** Loads a single product. `error` is a ProductNotFoundError when the id does not exist. */
export function useProduct(id: string): UseProductResult {
  const result = useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
  });

  return {
    data: result.data?.data,
    isLoading: result.isPending,
    isError: result.isError,
    error: result.error ?? null,
    refetch: result.refetch,
  };
}
