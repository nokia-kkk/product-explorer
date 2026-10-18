import type { ProductSortField, SortOrder } from '@miniapp/shared';

/**
 * A sort choice offered in the toolbar. The select binds to `value`, a composite
 * of field and direction, so one control covers both `sortBy` and `order`.
 */
export type SortOption = {
  value: `${ProductSortField}:${SortOrder}`;
  field: ProductSortField;
  order: SortOrder;
  label: string;
};

export const SORT_OPTIONS: SortOption[] = [
  { field: 'name', order: 'asc', value: 'name:asc', label: 'Name A-Z' },
  { field: 'name', order: 'desc', value: 'name:desc', label: 'Name Z-A' },
  { field: 'price', order: 'asc', value: 'price:asc', label: 'Price low-high' },
  { field: 'price', order: 'desc', value: 'price:desc', label: 'Price high-low' },
  { field: 'rating', order: 'desc', value: 'rating:desc', label: 'Rating high-low' },
];

/** The composite value the sort select expects for a given field and direction. */
export function sortOptionValue(sortBy: ProductSortField, order: SortOrder): string {
  return `${sortBy}:${order}`;
}

/** Splits a composite sort value back into its field and direction. */
export function parseSortOptionValue(value: string): {
  sortBy: ProductSortField;
  order: SortOrder;
} {
  const [field, direction] = value.split(':');
  const option = SORT_OPTIONS.find((candidate) => candidate.value === `${field}:${direction}`);
  const fallback = SORT_OPTIONS[0];
  return option
    ? { sortBy: option.field, order: option.order }
    : { sortBy: fallback.field, order: fallback.order };
}
