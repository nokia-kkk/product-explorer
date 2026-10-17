import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import type { CategoryListResponse, ProductDetailResponse, ProductListResponse } from './types';

function stubApiFetch() {
  const productsResponse: ProductListResponse = {
    data: [
      {
        id: 1,
        title: 'Essence Mascara Lash Princess',
        price: 9.99,
        discountPercentage: 7.17,
        rating: 4.94,
        thumbnail: 'https://cdn.dummyjson.com/mascara.webp',
        brand: 'Essence',
        category: 'beauty',
      },
    ],
    meta: { total: 1, page: 1, limit: 12, pageCount: 1 },
  };
  const categoriesResponse: CategoryListResponse = {
    data: [{ id: 1, name: 'Beauty', slug: 'beauty', productCount: 10 }],
    meta: { total: 1 },
  };
  const productDetailResponse: ProductDetailResponse = {
    data: {
      id: 1,
      title: 'Essence Mascara Lash Princess',
      description: 'A volumising mascara.',
      price: 9.99,
      discountPercentage: 7.17,
      rating: 4.94,
      stock: 99,
      brand: 'Essence',
      category: 'Beauty',
      thumbnail: 'https://cdn.dummyjson.com/mascara.webp',
      images: ['https://cdn.dummyjson.com/mascara.webp'],
    },
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes('/api/categories')
        ? categoriesResponse
        : /\/api\/products\/\d+$/.test(url)
          ? productDetailResponse
          : productsResponse;
      return {
        ok: true,
        status: 200,
        json: async () => body,
      } as unknown as Response;
    })
  );
}

function renderApp(initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('App', () => {
  beforeEach(() => {
    stubApiFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the product list page with header navigation at /', async () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'MiniApp' })).toHaveAttribute('href', '/');
    expect(within(header).getByRole('link', { name: 'Categories' })).toHaveAttribute(
      'href',
      '/categories'
    );
    expect(within(header).getByRole('searchbox', { name: 'Search products' })).toBeInTheDocument();

    await screen.findByTestId('product-price');
    expect(screen.getByText('Essence Mascara Lash Princess')).toBeInTheDocument();
  });

  it('renders the product detail page at /products/:id', async () => {
    renderApp(['/products/1']);

    expect(
      await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' })
    ).toBeInTheDocument();
  });

  it('renders the category list page at /categories', async () => {
    renderApp(['/categories']);

    expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Beauty/ })).toHaveAttribute(
      'href',
      '/categories/beauty'
    );
  });

  it('renders the category detail page at /categories/:slug', async () => {
    renderApp(['/categories/beauty']);

    expect(await screen.findByRole('heading', { level: 1, name: 'Beauty' })).toBeInTheDocument();
    await screen.findByTestId('product-price');
  });

  it('hides the header search input on non-listing routes', () => {
    renderApp(['/categories']);

    expect(screen.queryByRole('searchbox', { name: 'Search products' })).not.toBeInTheDocument();
  });

  it('toggles the mobile navigation drawer', () => {
    renderApp(['/']);

    const toggle = screen.getByRole('button', { name: 'Toggle navigation menu' });
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    const drawer = screen.getByRole('navigation', { name: 'Mobile' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(drawer).getByRole('link', { name: 'Categories' })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
  });
});
