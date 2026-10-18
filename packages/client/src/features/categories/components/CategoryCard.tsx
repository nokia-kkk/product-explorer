import type { CategoryWithCount } from '@miniapp/shared';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

type CategoryCardProps = {
  category: CategoryWithCount;
};

export function CategoryCard({ category }: CategoryCardProps) {
  const count = category.productCount;

  return (
    <Card className="rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link
        to={`/categories/${category.slug}`}
        className="flex flex-col gap-1 text-foreground hover:underline"
      >
        <span className="text-base font-medium capitalize">{category.name}</span>
        <span className="text-sm text-muted-foreground">
          {count} {count === 1 ? 'product' : 'products'}
        </span>
      </Link>
    </Card>
  );
}
