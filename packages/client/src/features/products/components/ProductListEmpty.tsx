import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProductListEmptyProps = {
  onClearFilters: () => void;
};

export function ProductListEmpty({ onClearFilters }: ProductListEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-4 py-16 text-center">
      <Search aria-hidden="true" className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">No products found</h2>
      <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
      <Button type="button" variant="outline" onClick={onClearFilters}>
        Clear filters
      </Button>
    </div>
  );
}
