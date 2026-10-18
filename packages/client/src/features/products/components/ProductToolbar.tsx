import { useEffect, useRef, useState } from 'react';
import type { CategoryWithCount, ProductSortField, SortOrder } from '@miniapp/shared';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { SORT_OPTIONS, parseSortOptionValue, sortOptionValue } from '../lib/sortOptions';

const SEARCH_DEBOUNCE_MS = 300;

type ProductToolbarProps = {
  title: string;
  search: string;
  category: string;
  sortBy: ProductSortField;
  order: SortOrder;
  categories: CategoryWithCount[];
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
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: ProductToolbarProps) {
  const [term, setTerm] = useState(search);
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
  // Tracks the last value this input committed to the URL, so the two effects
  // below can tell "the user typed this" apart from "the URL changed".
  const lastCommitted = useRef(search);

  // Push a settled term outward. Skipped when the change came from the URL.
  useEffect(() => {
    if (debouncedTerm === lastCommitted.current) return;
    lastCommitted.current = debouncedTerm;
    onSearchChange(debouncedTerm.trim());
  }, [debouncedTerm, onSearchChange]);

  // Keep the input in sync when the search param changes externally
  // (e.g. via the header search or "Clear filters").
  useEffect(() => {
    if (search === lastCommitted.current) return;
    lastCommitted.current = search;
    setTerm(search);
  }, [search]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <h1 className="text-2xl font-semibold capitalize text-foreground md:mr-auto">{title}</h1>

      <Input
        type="search"
        name="q"
        aria-label="Search products"
        placeholder="Search products…"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        className="md:w-64"
      />

      {onCategoryChange && (
        <Select
          value={category || ALL_CATEGORIES}
          onValueChange={(value) => {
            onCategoryChange(value === ALL_CATEGORIES ? '' : value);
          }}
        >
          <SelectTrigger aria-label="Filter by category" className="md:w-48">
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
        <SelectTrigger aria-label="Sort products" className="md:w-48">
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
  );
}

/** Radix Select cannot hold an empty-string value, so "no filter" needs a sentinel. */
const ALL_CATEGORIES = '__all__';
