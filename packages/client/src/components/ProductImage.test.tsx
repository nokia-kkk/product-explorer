import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ProductImage from './ProductImage';

describe('ProductImage', () => {
  it('renders the product image when the src loads', () => {
    const { getByRole } = render(
      <ProductImage src="https://example.com/mascara.webp" alt="Mascara" className="h-10 w-10" />
    );

    const image = getByRole('img', { name: 'Mascara' });
    expect(image).toHaveAttribute('src', 'https://example.com/mascara.webp');
  });

  it('shows a placeholder SVG when the image fails to load', () => {
    const { getByRole, container } = render(
      <ProductImage src="https://example.com/broken.webp" alt="Mascara" className="h-10 w-10" />
    );

    fireEvent.error(getByRole('img', { name: 'Mascara' }));

    expect(getByRole('img', { name: 'Mascara' })).toContainElement(
      container.querySelector('[data-testid="product-image-placeholder"]')
    );
  });

  it('renders the placeholder when no src is provided', () => {
    const { getByRole, container } = render(<ProductImage alt="Mascara" />);

    expect(getByRole('img', { name: 'Mascara' })).toContainElement(
      container.querySelector('[data-testid="product-image-placeholder"]')
    );
  });
});
