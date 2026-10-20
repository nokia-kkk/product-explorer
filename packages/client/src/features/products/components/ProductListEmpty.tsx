import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProductListEmptyProps = {
  onClearFilters: () => void;
};

export function ProductListEmpty({ onClearFilters }: ProductListEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
      </span>
      <h2 className="mt-2 font-display text-2xl text-foreground">No products found</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        Try a different search term, or widen the category and sort filters.
      </p>
      <Button type="button" className="mt-2" onClick={onClearFilters}>
        Clear filters
      </Button>
    </div>
  );
}
