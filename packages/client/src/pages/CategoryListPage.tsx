import { useCategories } from '../features/categories/hooks/useCategories';
import { CategoryCard } from '../features/categories/components/CategoryCard';
import { CategoryListSkeleton } from '../features/categories/components/CategoryListSkeleton';
import { CategoryListError } from '../features/products/components/ProductListError';

export function CategoryListPage() {
  const categories = useCategories();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Categories</h1>

      {categories.isError && <CategoryListError onRetry={() => categories.refetch()} />}

      {categories.isLoading && <CategoryListSkeleton count={8} />}

      {!categories.isLoading && !categories.isError && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.data.map((category) => (
            <li key={category.id}>
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
