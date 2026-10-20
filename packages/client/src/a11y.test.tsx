import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from './app/App';
import { ProductCard } from './features/products/components/ProductCard';
import { Pagination } from './features/products/components/Pagination';
import { ProductImage } from './features/products/components/ProductImage';
import type {
  CategoryListResponse,
  ProductListResponse,
  ProductDetailResponse,
} from '@miniapp/shared';

type Product = ProductListResponse['data'][number];

const product: Product = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  price: 9.99,
  discountPercentage: 7.17,
  rating: 4.94,
  thumbnail: 'https://cdn.dummyjson.com/mascara.webp',
  brand: 'Essence',
  category: 'beauty',
  categorySlug: 'beauty',
};

const productsResponse: ProductListResponse = {
  data: [product],
  meta: { total: 120, page: 2, limit: 12, pageCount: 10 },
};

const categoriesResponse: CategoryListResponse = {
  data: [{ id: 1, name: 'Beauty', slug: 'beauty', productCount: 10 }],
  meta: { total: 1 },
};

const productDetailResponse: ProductDetailResponse = {
  data: {
    ...product,
    description: 'A volumising mascara.',
    stock: 99,
    images: ['https://cdn.dummyjson.com/mascara.webp'],
  },
};

function renderRoute(url: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('accessibility', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const body = url.includes('/api/categories')
          ? categoriesResponse
          : /\/api\/products\/\d+$/.test(url)
            ? productDetailResponse
            : productsResponse;
        return { ok: true, status: 200, json: async () => body } as unknown as Response;
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('product list page has no axe violations', async () => {
    const { container } = renderRoute('/');
    await screen.findByTestId('product-price');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('product detail page has no axe violations', async () => {
    const { container } = renderRoute('/products/1');
    await screen.findByTestId('product-price');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('category list page has no axe violations', async () => {
    const { container } = renderRoute('/categories');
    await screen.findByRole('link', { name: /Beauty/ });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('empty state has no axe violations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ data: [], meta: { total: 0, page: 1, limit: 12, pageCount: 0 } }),
      })) as unknown as typeof fetch
    );

    const { container } = renderRoute('/?q=nothing');
    await screen.findByText('No products found');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('error banner has no axe violations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Boom');
      }) as unknown as typeof fetch
    );

    const { container } = renderRoute('/');
    await screen.findByRole('alert');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('product card has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('image placeholder has no axe violations', async () => {
    const { container } = render(<ProductImage alt="Mascara" className="h-10 w-10" />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('pagination has no axe violations', async () => {
    const { container } = render(
      <Pagination page={5} pageCount={10} onPageChange={() => undefined} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
