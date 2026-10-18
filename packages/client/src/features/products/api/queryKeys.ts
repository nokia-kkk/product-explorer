import type { ProductListQuery } from './products';

/** Query keys for the products feature. Object form so keys are not order-sensitive. */
export const productKeys = {
  all: ['products'] as const,
  list: (query: ProductListQuery) => [...productKeys.all, 'list', query] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
};
