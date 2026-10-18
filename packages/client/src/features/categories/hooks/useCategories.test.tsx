import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CategoryListResponse } from '@miniapp/shared';
import { useCategories } from './useCategories';

const response: CategoryListResponse = {
  data: [
    { id: 1, name: 'Beauty', slug: 'beauty', productCount: 10 },
    { id: 2, name: 'Fragrances', slug: 'fragrances', productCount: 5 },
  ],
  meta: { total: 2 },
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useCategories', () => {
  it('exposes the flat list from the categories endpoint', async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        urls.push(String(input));
        return { ok: true, status: 200, json: async () => response } as Response;
      })
    );

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(urls[0]).toBe('/api/categories');
    expect(result.current.data).toEqual(response.data);
    expect(result.current.isError).toBe(false);
  });

  it('gives an empty list rather than undefined while loading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );

    const { result } = renderHook(() => useCategories(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('reports an error and an empty list when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response)
    );

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toContain('Failed to load categories');
    expect(result.current.data).toEqual([]);
  });
});
