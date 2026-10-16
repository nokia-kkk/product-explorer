import { useEffect, useRef, useState } from 'react';

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
  { value: 'price:asc', label: 'Price low-high' },
  { value: 'price:desc', label: 'Price high-low' },
  { value: 'rating:desc', label: 'Rating high-low' },
] as const;

type ProductToolbarProps = {
  search: string;
  category: string;
  sortBy: string;
  order: string;
  categories: { id: number; name: string; slug: string }[];
  onSearchChange: (q: string) => void;
  onCategoryChange: (slug: string) => void;
  onSortChange: (sortBy: string, order: string) => void;
};

const inputClassName =
  'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400';

/** Debounces a value so it only settles after 300ms of inactivity. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setDebounced(value), delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delayMs]);

  return debounced;
}

export default function ProductToolbar({
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
  const debouncedTerm = useDebouncedValue(term, 300);
  const lastCommitted = useRef(search);

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
      <h1 className="text-2xl font-semibold text-gray-900 md:mr-auto">Products</h1>

      <input
        type="search"
        name="q"
        aria-label="Search products"
        placeholder="Search products…"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        className={`${inputClassName} md:w-64`}
      />

      <select
        aria-label="Filter by category"
        name="category"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        className={`${inputClassName} md:w-48`}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort products"
        name="sortBy"
        value={`${sortBy}:${order}`}
        onChange={(event) => {
          const [nextSortBy, nextOrder] = event.target.value.split(':');
          onSortChange(nextSortBy, nextOrder);
        }}
        className={`${inputClassName} md:w-48`}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
