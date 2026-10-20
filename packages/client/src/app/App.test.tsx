import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import type {
  CategoryListResponse,
  ProductDetailResponse,
  ProductListResponse,
} from '@miniapp/shared';

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
        categorySlug: 'beauty',
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
    expect(within(header).getByRole('link', { name: 'Nokia app' })).toHaveAttribute('href', '/');
    expect(within(header).getByRole('link', { name: 'Categories' })).toHaveAttribute(
      'href',
      '/categories'
    );
    expect(
      within(header).getByRole('searchbox', { name: 'Search all products' })
    ).toBeInTheDocument();

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

    expect(
      screen.queryByRole('searchbox', { name: 'Search all products' })
    ).not.toBeInTheDocument();
  });

  it('toggles the mobile navigation drawer', () => {
    renderApp();

    const toggle = screen.getByRole('button', { name: 'Toggle navigation menu' });
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    const drawer = screen.getByRole('navigation', { name: 'Mobile' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(drawer).getByRole('link', { name: 'Categories' })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
  });

  it('navigates from a product card to that product', async () => {
    renderApp();

    await screen.findByTestId('product-price');
    const links = screen.getAllByRole('link', { name: 'Essence Mascara Lash Princess' });
    fireEvent.click(links[0]);

    expect(await screen.findByText('A volumising mascara.')).toBeInTheDocument();
  });

  it('searches from the header without pressing Enter', async () => {
    const requestedUrls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (!url.includes('/api/categories')) requestedUrls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: [], meta: { total: 0, page: 1, limit: 12, pageCount: 0 } }),
        } as unknown as Response;
      })
    );

    renderApp();
    await screen.findByText('No products found');
    requestedUrls.length = 0;

    const header = screen.getByRole('banner');
    fireEvent.change(within(header).getByRole('searchbox', { name: 'Search all products' }), {
      target: { value: 'mascara' },
    });

    await waitFor(
      () => {
        expect(requestedUrls.some((url) => url.includes('q=mascara'))).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it('keeps both search inputs in sync, including when cleared', async () => {
    renderApp(['/?q=mascara']);

    const header = screen.getByRole('banner');
    const headerInput = within(header).getByRole('searchbox', { name: 'Search all products' });
    const toolbarInput = screen.getByRole('searchbox', { name: 'Search products' });

    // The URL seeds both inputs.
    await waitFor(() => {
      expect(headerInput).toHaveValue('mascara');
      expect(toolbarInput).toHaveValue('mascara');
    });

    // Typing in the toolbar reaches the header once the term settles.
    fireEvent.change(toolbarInput, { target: { value: 'gown' } });
    await waitFor(
      () => {
        expect(headerInput).toHaveValue('gown');
      },
      { timeout: 2000 }
    );

    // Clearing either one clears both and drops the param.
    fireEvent.change(headerInput, { target: { value: '' } });
    await waitFor(
      () => {
        expect(toolbarInput).toHaveValue('');
      },
      { timeout: 2000 }
    );
  });

  it('submits the header search and refetches with the q param', async () => {
    const requestedUrls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (!url.includes('/api/categories')) {
          requestedUrls.push(url);
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [],
            meta: { total: 0, page: 1, limit: 12, pageCount: 0 },
          }),
        } as unknown as Response;
      })
    );

    renderApp();
    await screen.findByText('No products found');
    requestedUrls.length = 0;

    const header = screen.getByRole('banner');
    fireEvent.change(within(header).getByRole('searchbox', { name: 'Search all products' }), {
      target: { value: '  mascara  ' },
    });
    fireEvent.submit(within(header).getByRole('search'));

    await waitFor(() => {
      expect(requestedUrls.some((url) => url.includes('q=mascara'))).toBe(true);
    });
    // Trimmed, so the term carries no stray spaces.
    expect(requestedUrls.every((url) => !url.includes('+'))).toBe(true);
  });
});
