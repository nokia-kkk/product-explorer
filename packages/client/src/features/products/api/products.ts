import type { ProductDetailResponse, ProductListResponse } from '@miniapp/shared';

/**
 * A response meaning the product does not exist — malformed id (400) or unknown
 * id (404). Distinct from a transport failure because it is not retryable.
 */
export class ProductNotFoundError extends Error {}

/** The product list request. Every field is optional; the server applies its defaults. */
export type ProductListQuery = {
  q?: string;
  category?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
};

function buildProductListUrl(query: ProductListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.order) params.set('order', query.order);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const search = params.toString();
  return search ? `/api/products?${search}` : '/api/products';
}

export async function fetchProducts(query: ProductListQuery): Promise<ProductListResponse> {
  const response = await fetch(buildProductListUrl(query));
  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }
  return (await response.json()) as ProductListResponse;
}

export async function fetchProduct(id: string): Promise<ProductDetailResponse> {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`);
  // 400 = the server rejected the id as malformed, 404 = no such product. Either
  // way the product does not exist, which is not a retryable failure.
  if (response.status === 400 || response.status === 404) {
    throw new ProductNotFoundError(`Product ${id} not found`);
  }
  if (!response.ok) {
    throw new Error(`Failed to load product (${response.status})`);
  }
  return (await response.json()) as ProductDetailResponse;
}
