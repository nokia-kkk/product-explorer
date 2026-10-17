import type { CategoryWithCount } from '@shared/types';
import { Link } from 'react-router-dom';

type CategoryCardProps = {
  category: CategoryWithCount;
};

export default function CategoryCard({ category }: CategoryCardProps) {
  const count = category.productCount;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link
        to={`/categories/${category.slug}`}
        className="flex flex-col gap-1 text-gray-900 hover:underline"
      >
        <span className="text-base font-medium capitalize">{category.name}</span>
        <span className="text-sm text-gray-600">
          {count} {count === 1 ? 'product' : 'products'}
        </span>
      </Link>
    </article>
  );
}
