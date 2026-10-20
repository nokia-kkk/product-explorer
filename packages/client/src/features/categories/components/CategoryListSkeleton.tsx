import { Skeleton } from '@/components/ui/skeleton';

type CategoryListSkeletonProps = {
  count?: number;
};

export function CategoryListSkeleton({ count = 8 }: CategoryListSkeletonProps) {
  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading categories"
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={`skeleton-${index}`} className="rounded-md border border-border bg-card p-4">
          <Skeleton className="h-5 w-2/3 rounded-sm" />
          <Skeleton className="mt-2 h-3 w-1/3 rounded-sm" />
        </li>
      ))}
    </ul>
  );
}
