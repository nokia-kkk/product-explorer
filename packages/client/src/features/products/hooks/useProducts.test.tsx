import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ProductListResponse } from '@miniapp/shared';
import { useProducts } from './useProducts';
import { useProduct } from './useProduct';
import { ProductNotFoundError } from '../api/products';

const product = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  price: 9.99,
  discountPercentage: 7.17,
  rating: 4.94,
  thumbnail: 'thumb.webp',
  brand: 'Essence',
  category: 'beauty',
  categorySlug: 'beauty',
};

const listResponse: ProductListResponse = {
  data: [product],
  meta: { total: 120, page: 2, limit: 12, pageCount: 10 },
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function stubFetch(body: unknown) {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return { ok: true, status: 200, json: async () => body } as Response;
    })
  );
  return urls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useProducts', () => {
  it('exposes the flat list and meta, not the raw response envelope', async () => {
    stubFetch(listResponse);

    const { result } = renderHook(() => useProducts({ q: 'mascara' }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([product]);
    expect(result.current.meta).toEqual(listResponse.meta);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('builds the request from the given query', async () => {
    const urls = stubFetch(listResponse);

    const { result } = renderHook(
      () =>
        useProducts({
          q: 'jacket',
          category: 'beauty',
          sortBy: 'price',
          order: 'desc',
          page: 2,
          limit: 12,
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const url = new URL(urls[0], 'http://localhost');
    expect(url.pathname).toBe('/api/products');
    expect(url.searchParams.get('q')).toBe('jacket');
    expect(url.searchParams.get('category')).toBe('beauty');
    expect(url.searchParams.get('sortBy')).toBe('price');
    expect(url.searchParams.get('order')).toBe('desc');
    expect(url.searchParams.get('page')).toBe('2');
  });

  it('reports an error and an empty list when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Boom');
      })
    );

    const { result } = renderHook(() => useProducts({}), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Boom');
    expect(result.current.data).toEqual([]);
    expect(result.current.meta).toBeUndefined();
  });
});

describe('useProduct', () => {
  it('unwraps the detail envelope', async () => {
    const urls = stubFetch({
      data: { ...product, description: 'A mascara.', stock: 9, images: ['a.webp'] },
    });

    const { result } = renderHook(() => useProduct('10'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(urls[0]).toBe('/api/products/10');
    expect(result.current.data?.title).toBe('Essence Mascara Lash Princess');
  });

  it('surfaces a ProductNotFoundError for a 404 so the page can show "not found"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }) as Response)
    );

    const { result } = renderHook(() => useProduct('9999'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ProductNotFoundError);
    expect(result.current.data).toBeUndefined();
  });
});
