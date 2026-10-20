import { Skeleton } from '@/components/ui/skeleton';

type ProductListSkeletonProps = {
  /** How many placeholder cards to render. */
  count?: number;
};

export function ProductListSkeleton({ count = 8 }: ProductListSkeletonProps) {
  return (
    <ul
      className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, index) => (
        <li
          key={`skeleton-${index}`}
          data-testid="product-skeleton"
          className="flex flex-col overflow-hidden rounded-md border border-border bg-card"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex flex-col gap-2 p-3.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="mt-1 h-4 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
