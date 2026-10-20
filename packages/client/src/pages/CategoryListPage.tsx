import { useCategories } from '../features/categories/hooks/useCategories';
import { CategoryCard } from '../features/categories/components/CategoryCard';
import { CategoryListSkeleton } from '../features/categories/components/CategoryListSkeleton';
import { CategoryListError } from '../features/products/components/ProductListError';

export function CategoryListPage() {
  const categories = useCategories();

  return (
    <section className="flex flex-col gap-6">
      <div className="masthead">
        <h1 className="font-display text-3xl leading-none text-foreground md:text-4xl">
          Categories
        </h1>
        {categories.data && (
          <p className="text-xs text-muted-foreground">
            {categories.data.length} {categories.data.length === 1 ? 'category' : 'categories'}
          </p>
        )}
      </div>

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
