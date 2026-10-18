import { Skeleton } from '@/components/ui/skeleton';

/** The placeholder shown while a product detail is loading. */
export function ProductDetailSkeleton() {
  return (
    <div
      data-testid="product-detail-skeleton"
      aria-busy="true"
      aria-label="Loading product"
      className="grid gap-8 md:grid-cols-2"
    >
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/3 rounded" />
        <Skeleton className="h-8 w-1/4 rounded" />
        <Skeleton className="h-24 w-full rounded" />
      </div>
    </div>
  );
}
