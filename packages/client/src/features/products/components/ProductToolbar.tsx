import type { CategoryWithCount, ProductSortField, SortOrder } from '@miniapp/shared';
import { SearchInput } from '@/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearchField } from '@/shared/hooks/useSearchField';
import { SORT_OPTIONS, parseSortOptionValue, sortOptionValue } from '../lib/sortOptions';

type ProductToolbarProps = {
  title: string;
  search: string;
  category: string;
  sortBy: ProductSortField;
  order: SortOrder;
  categories: CategoryWithCount[];
  /** Total results for the current query, shown beside the title. */
  total?: number;
  onSearchChange: (q: string) => void;
  onSortChange: (sortBy: ProductSortField, order: SortOrder) => void;
  /** Omitted when the category is fixed by the route, which hides the select. */
  onCategoryChange?: (slug: string) => void;
};

export function ProductToolbar({
  title,
  search,
  category,
  sortBy,
  order,
  categories,
  total,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: ProductToolbarProps) {
  // Debounced, and kept in sync with the URL and the header's search input.
  const [term, setTerm] = useSearchField(search, onSearchChange);

  return (
    <div className="flex flex-col gap-5">
      <div className="masthead">
        <h1 className="font-display text-3xl capitalize leading-none text-foreground md:text-4xl">
          {title}
        </h1>
        {total !== undefined && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {total} {total === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          name="q"
          aria-label="Search products"
          placeholder="Search products…"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          className="sm:max-w-xs"
        />

        <div className="flex gap-3 sm:ml-auto">
          {onCategoryChange && (
            <Select
              value={category || ALL_CATEGORIES}
              onValueChange={(value) => {
                onCategoryChange(value === ALL_CATEGORIES ? '' : value);
              }}
            >
              <SelectTrigger aria-label="Filter by category" className="flex-1 sm:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={sortOptionValue(sortBy, order)}
            onValueChange={(value) => {
              const next = parseSortOptionValue(value);
              onSortChange(next.sortBy, next.order);
            }}
          >
            <SelectTrigger aria-label="Sort products" className="flex-1 sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/** Radix Select cannot hold an empty-string value, so "no filter" needs a sentinel. */
const ALL_CATEGORIES = '__all__';
