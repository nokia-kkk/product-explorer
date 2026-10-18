import { useQuery } from '@tanstack/react-query';
import type { CategoryWithCount } from '@miniapp/shared';
import { fetchCategories } from '../api/categories';
import { categoryKeys } from '../api/queryKeys';

export type UseCategoriesResult = {
  data: CategoryWithCount[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

/** Loads the category list. Shared by the category pages and the product toolbar's filter. */
export function useCategories(): UseCategoriesResult {
  const result = useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
  });

  return {
    data: result.data?.data ?? [],
    isLoading: result.isPending,
    isError: result.isError,
    error: result.error ?? null,
    refetch: result.refetch,
  };
}
