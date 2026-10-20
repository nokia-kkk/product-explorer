import type { CategoryWithCount } from '@miniapp/shared';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

type CategoryCardProps = {
  category: CategoryWithCount;
};

export function CategoryCard({ category }: CategoryCardProps) {
  const count = category.productCount;

  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group flex h-full items-start justify-between gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="flex flex-col gap-1">
        <span className="font-display text-lg capitalize text-foreground">{category.name}</span>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? 'product' : 'products'}
        </span>
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
      />
    </Link>
  );
}
