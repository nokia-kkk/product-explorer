import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductDetailPage } from './ProductDetailPage';
import type { ProductDetailResponse } from '@miniapp/shared';

const product: ProductDetailResponse['data'] = {
  id: 10,
  title: 'Essence Mascara Lash Princess',
  description: 'A volumising mascara with a curved brush.',
  price: 9.99,
  discountPercentage: 7.17,
  rating: 4.94,
  stock: 99,
  brand: 'Essence',
  category: 'Beauty',
  thumbnail: 'thumb.webp',
  images: ['image-1.webp', 'image-2.webp', 'image-3.webp'],
};

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body,
  } as Response;
}

function renderPage(url = '/products/10') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProductDetailPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let response: Response | Error | Promise<Response>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    response = jsonResponse({ data: product });
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      // Mirror the server's routing: 400 for a malformed id (parseProductId),
      // 404 for a well-formed id that does not exist, 200 only for id 10.
      const id = decodeURIComponent(String(input).split('/').pop() ?? '');
      if (!/^\d+$/.test(id)) {
        return jsonResponse({ error: 'Invalid product id' }, 400);
      }
      if (id !== '10') {
        return jsonResponse({ error: 'Product not found' }, 404);
      }
      if (response instanceof Error) throw response;
      return response;
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a loading skeleton while the product is fetching', () => {
    response = new Promise(() => {}) as Promise<Response>;
    renderPage();

    expect(screen.getByTestId('product-detail-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders the full product details once loaded', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' })
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith('/api/products/10');

    expect(screen.getByText('A volumising mascara with a curved brush.')).toBeInTheDocument();
    expect(screen.getByText('Essence')).toBeInTheDocument();
    expect(screen.getByText('Beauty')).toBeInTheDocument();
    expect(screen.getByTestId('product-rating')).toHaveTextContent('4.9');

    // Discounted price shown, original struck through.
    expect(screen.getByTestId('product-price')).toHaveTextContent('$9.27');
    expect(screen.getByTestId('product-price-original')).toHaveTextContent('$9.99');

    expect(screen.getByTestId('product-stock')).toHaveTextContent('In stock');
    expect(screen.queryByTestId('out-of-stock-badge')).not.toBeInTheDocument();
  });

  it('shows the original price with no strikethrough when there is no discount', async () => {
    response = jsonResponse({
      data: { ...product, price: 12.5, discountPercentage: 0 },
    });
    renderPage();

    await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' });

    expect(screen.getByTestId('product-price')).toHaveTextContent('$12.50');
    expect(screen.queryByTestId('product-price-original')).not.toBeInTheDocument();
  });

  it('shows an out of stock badge when stock is zero', async () => {
    response = jsonResponse({ data: { ...product, stock: 0 } });
    renderPage();

    await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' });

    expect(screen.getByTestId('out-of-stock-badge')).toHaveTextContent('Out of stock');
    expect(screen.queryByTestId('product-stock')).not.toBeInTheDocument();
  });

  it('links back to the product list', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' });

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/');
  });

  it('shows the first image large with a thumbnail strip', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' });

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', 'image-1.webp');

    const strip = screen.getByRole('list', { name: 'Product images' });
    expect(within(strip).getAllByRole('button')).toHaveLength(3);
    expect(within(strip).getByRole('button', { name: 'View image 1' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('swaps the main image when a thumbnail is clicked', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' });

    fireEvent.click(screen.getByRole('button', { name: 'View image 3' }));

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', 'image-3.webp');
    expect(screen.getByRole('button', { name: 'View image 3' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByRole('button', { name: 'View image 1' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('falls back to the thumbnail when a product has no image list', async () => {
    response = jsonResponse({ data: { ...product, images: [] } });
    renderPage();

    await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' });

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', 'thumb.webp');
    expect(screen.queryByRole('list', { name: 'Product images' })).not.toBeInTheDocument();
  });

  it('shows an error banner with retry when the request fails', async () => {
    response = new Error('Boom');
    renderPage();

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('Failed to load product');

    response = jsonResponse({ data: product });
    fireEvent.click(within(banner).getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', { name: 'Essence Mascara Lash Princess' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a not-found message when the product does not exist', async () => {
    response = jsonResponse({ error: 'Product not found' }, 404);
    renderPage('/products/9999');

    expect(await screen.findByTestId('product-not-found')).toHaveTextContent('Product not found');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/');
  });

  it('shows not found for a well-formed id that does not exist', async () => {
    renderPage('/products/9999');

    expect(await screen.findByTestId('product-not-found')).toBeInTheDocument();
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it.each(['abc', '%20', '0', '-1'])(
    'shows not found (not a retryable error) when the server rejects id %s as malformed',
    async (id) => {
      renderPage(`/products/${id}`);

      expect(await screen.findByTestId('product-not-found')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    }
  );
});
