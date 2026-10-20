import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CategoryDetailPage } from './CategoryDetailPage';
import { selectOption } from '../test/selectOption';
import type { CategoryListResponse, ProductListResponse } from '@miniapp/shared';

type Product = ProductListResponse['data'][number];

const productFixture = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  title: 'Essence Mascara Lash Princess',
  price: 9.99,
  discountPercentage: 7.17,
  rating: 4.94,
  thumbnail: 'https://cdn.dummyjson.com/mascara.webp',
  brand: 'Essence',
  category: 'Beauty',
  categorySlug: 'beauty',
  ...overrides,
});

const categoriesFixture: CategoryListResponse = {
  data: [
    { id: 1, name: 'Beauty', slug: 'beauty', productCount: 10 },
    { id: 2, name: 'Fragrances', slug: 'fragrances', productCount: 5 },
  ],
  meta: { total: 2 },
};

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function renderPage(url = '/categories/beauty') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/categories/:slug" element={<CategoryDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CategoryDetailPage', () => {
  let productUrls: string[];

  beforeEach(() => {
    vi.unstubAllGlobals();
    productUrls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/categories')) {
          return jsonResponse(categoriesFixture);
        }
        productUrls.push(url);
        return jsonResponse({
          data: [productFixture()],
          meta: { total: 10, page: 1, limit: 12, pageCount: 1 },
        } satisfies ProductListResponse);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists products filtered by the category from the path', async () => {
    renderPage();

    await screen.findByTestId('product-price');

    expect(productUrls.length).toBeGreaterThan(0);
    expect(productUrls.every((url) => url.includes('category=beauty'))).toBe(true);
    expect(screen.getByText('Essence Mascara Lash Princess')).toBeInTheDocument();
  });

  it('titles the page with the category name and shows a breadcrumb', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Beauty' })).toBeInTheDocument();

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByRole('link', { name: 'Categories' })).toHaveAttribute(
      'href',
      '/categories'
    );
    expect(within(breadcrumb).getByText('Beauty')).toBeInTheDocument();
  });

  it('hides the category filter because the path fixes it', async () => {
    renderPage();

    await screen.findByTestId('product-price');

    expect(screen.queryByRole('combobox', { name: 'Filter by category' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toBeInTheDocument();
  });

  it('keeps the category filter when sorting or paging', async () => {
    renderPage();

    await screen.findByTestId('product-price');

    await selectOption('Sort products', 'Price low-high');

    await waitFor(() => {
      expect(
        productUrls.some(
          (url) => url.includes('sortBy=price&order=asc') && url.includes('category=beauty')
        )
      ).toBe(true);
    });
  });
});
