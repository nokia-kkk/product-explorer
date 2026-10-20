import { Skeleton } from '@/components/ui/skeleton';

/** The placeholder shown while a product detail is loading. */
export function ProductDetailSkeleton() {
  return (
    <div
      data-testid="product-detail-skeleton"
      aria-busy="true"
      aria-label="Loading product"
      className="grid gap-8 md:grid-cols-2 md:gap-12"
    >
      <Skeleton className="aspect-square w-full rounded-md" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-8 w-1/3" />
        <Skeleton className="h-6 w-32" />
        <div className="flex flex-col gap-2 pt-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      </div>
    </div>
  );
}
