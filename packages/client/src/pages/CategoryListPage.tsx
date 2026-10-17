import { useQuery } from '@tanstack/react-query';
import type { CategoryListResponse } from '@shared/types';
import { fetchCategories } from '../lib/api';
import CategoryCard from '../components/CategoryCard';

export default function CategoryListPage() {
  const categoriesQuery = useQuery<CategoryListResponse>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const categories = categoriesQuery.data?.data ?? [];

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>

      {categoriesQuery.isError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>Failed to load categories. Please try again.</span>
          <button
            type="button"
            className="rounded-md border border-red-300 bg-white px-3 py-1 text-red-700 hover:bg-red-100"
            onClick={() => categoriesQuery.refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {categoriesQuery.isPending && (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-busy="true"
          aria-label="Loading categories"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <li
              key={`skeleton-${index}`}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-200" />
            </li>
          ))}
        </ul>
      )}

      {!categoriesQuery.isPending && !categoriesQuery.isError && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
