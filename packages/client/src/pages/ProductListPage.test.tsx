import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ProductListPage from './ProductListPage';
import type { CategoryListResponse, ProductListResponse } from '../types';

type Product = ProductListResponse['data'][number];

const productFixture = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  title: 'Essence Mascara Lash Princess',
  price: 9.99,
  discountPercentage: 7.17,
  rating: 4.94,
  thumbnail: 'https://cdn.dummyjson.com/mascara.webp',
  brand: 'Essence',
  category: 'beauty',
  ...overrides,
});

const categoriesFixture: CategoryListResponse = {
  data: [
    { id: 1, name: 'Beauty', slug: 'beauty', productCount: 10 },
    { id: 2, name: 'Fragrances', slug: 'fragrances', productCount: 5 },
  ],
  meta: { total: 2 },
};

function productResponse(
  products: Product[],
  overrides: Partial<ProductListResponse['meta']> = {}
): ProductListResponse {
  return {
    data: products,
    meta: {
      total: products.length * 10,
      page: 1,
      limit: 12,
      pageCount: 3,
      ...overrides,
    },
  };
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

function renderPage(initialUrl = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <ProductListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProductListPage', () => {
  let productUrls: string[];
  let productsResponse: ProductListResponse | Error | Promise<ProductListResponse>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    productUrls = [];
    productsResponse = productResponse([productFixture()]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/categories')) {
          return jsonResponse(categoriesFixture);
        }
        productUrls.push(url);
        if (productsResponse instanceof Error) {
          throw productsResponse;
        }
        return jsonResponse(productsResponse);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders product cards in a grid once loaded', async () => {
    renderPage();

    await screen.findByTestId('product-price');

    expect(screen.getByText('Essence Mascara Lash Princess')).toBeInTheDocument();
    expect(screen.getByText('beauty')).toBeInTheDocument();
    expect(screen.getByTestId('product-discount')).toHaveTextContent('-7%');
  });

  it('shows 8 skeleton cards while loading', () => {
    productsResponse = new Promise(() => {}) as Promise<ProductListResponse>;
    renderPage();

    expect(screen.getAllByTestId('product-skeleton')).toHaveLength(8);
    expect(screen.queryByText('Essence Mascara Lash Princess')).not.toBeInTheDocument();
  });

  it('shows an error banner that can be dismissed and retried', async () => {
    productsResponse = new Error('Boom');
    renderPage();

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('Failed to load products');

    // Dismiss removes the banner.
    fireEvent.click(within(banner).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // A new failed request (fresh query) shows the banner again.
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort products' }), {
      target: { value: 'price:asc' },
    });
    await screen.findByRole('alert');
  });

  it('reloads products when Retry is clicked', async () => {
    productsResponse = new Error('Boom');
    renderPage();

    const banner = await screen.findByRole('alert');
    const callsBefore = productUrls.length;

    productsResponse = productResponse([productFixture()]);
    fireEvent.click(within(banner).getByRole('button', { name: 'Retry' }));

    await screen.findByTestId('product-price');
    expect(productUrls.length).toBeGreaterThan(callsBefore);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the empty state with a clear-filters button', async () => {
    productsResponse = productResponse([], { total: 0, pageCount: 0 });
    renderPage('/?q=zzz&category=beauty');

    await screen.findByText('No products found');

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(productUrls.some((url) => !url.includes('q=') && !url.includes('category'))).toBe(
        true
      );
    });
  });

  it('debounces search input and resets page to 1', async () => {
    renderPage('/?page=2');

    await waitFor(() => expect(productUrls.length).toBeGreaterThan(0));
    const callsBeforeTyping = productUrls.length;

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search products' }), {
      target: { value: 'mascara' },
    });

    await waitFor(
      () => {
        expect(productUrls.length).toBeGreaterThan(callsBeforeTyping);
      },
      { timeout: 2000 }
    );

    const searchUrl = productUrls[productUrls.length - 1];
    expect(searchUrl).toContain('q=mascara');
    expect(searchUrl).toContain('page=1');
    expect(searchUrl).not.toContain('page=2');
  });

  it('resets page to 1 when the category changes', async () => {
    renderPage('/?page=3');

    await screen.findByRole('option', { name: 'Beauty' });
    const select = screen.getByRole('combobox', { name: 'Filter by category' });

    fireEvent.change(select, { target: { value: 'beauty' } });

    let categoryUrl: string | undefined;
    await waitFor(() => {
      categoryUrl = productUrls.find((url) => url.includes('category=beauty'));
      expect(categoryUrl).toBeDefined();
    });
    expect(categoryUrl).toContain('category=beauty');
    expect(categoryUrl).not.toContain('page=3');
  });

  it('supports all sort options', async () => {
    renderPage();

    const sort = await screen.findByRole('combobox', { name: 'Sort products' });

    fireEvent.change(sort, { target: { value: 'price:asc' } });
    await waitFor(() => {
      expect(productUrls.some((url) => url.includes('sortBy=price&order=asc'))).toBe(true);
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort products' }), {
      target: { value: 'rating:desc' },
    });
    await waitFor(() => {
      expect(productUrls.some((url) => url.includes('sortBy=rating&order=desc'))).toBe(true);
    });
  });

  it('renders pagination with all page numbers when the count is small', async () => {
    productsResponse = productResponse([productFixture()], {
      total: 60,
      pageCount: 5,
    });
    renderPage();

    await screen.findByTestId('product-price');

    const nav = screen.getByRole('navigation', { name: 'Product list pagination' });
    for (let page = 1; page <= 5; page++) {
      expect(within(nav).getByRole('button', { name: `Page ${page}` })).toBeInTheDocument();
    }
    expect(within(nav).getByText('Page 1 of 5')).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(within(nav).getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('navigates to the next page', async () => {
    renderPage();

    await screen.findByTestId('product-price');

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => {
      expect(productUrls.some((url) => url.includes('page=2'))).toBe(true);
    });
  });

  it('abbreviates page numbers beyond seven pages', async () => {
    productsResponse = productResponse([productFixture()], {
      total: 120,
      page: 5,
      pageCount: 10,
    });
    renderPage('/?page=5');

    await screen.findByTestId('product-price');

    const nav = screen.getByRole('navigation', { name: 'Product list pagination' });
    expect(within(nav).getAllByRole('button', { name: /^Page \d+$/ })).toHaveLength(5);
    expect(within(nav).getAllByText('…').length).toBeGreaterThan(0);
  });
});
