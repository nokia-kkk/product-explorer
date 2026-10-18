import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CategoryListPage } from './CategoryListPage';
import type { CategoryListResponse } from '@miniapp/shared';

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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/categories']}>
        <CategoryListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CategoryListPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(categoriesFixture))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a card per category linking to its detail page', async () => {
    renderPage();

    const link = await screen.findByRole('link', { name: /Beauty/ });
    expect(link).toHaveAttribute('href', '/categories/beauty');
    expect(screen.getByText('10 products')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Fragrances/ })).toHaveAttribute(
      'href',
      '/categories/fragrances'
    );
    expect(screen.getByText('5 products')).toBeInTheDocument();
  });

  it('shows an error banner that can be retried', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Boom'))
      .mockResolvedValue(jsonResponse(categoriesFixture));
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('Failed to load categories');

    fireEvent.click(within(banner).getByRole('button', { name: 'Retry' }));

    await screen.findByRole('link', { name: /Beauty/ });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
