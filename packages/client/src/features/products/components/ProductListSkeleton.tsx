import { Skeleton } from '@/components/ui/skeleton';

type ProductListSkeletonProps = {
  /** How many placeholder cards to render. */
  count?: number;
};

export function ProductListSkeleton({ count = 8 }: ProductListSkeletonProps) {
  return (
    <ul
      className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, index) => (
        <li
          key={`skeleton-${index}`}
          data-testid="product-skeleton"
          className="flex flex-col gap-2 overflow-hidden rounded-lg border bg-card p-3 shadow-sm"
        >
          <Skeleton className="aspect-square w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
        </li>
      ))}
    </ul>
  );
}
