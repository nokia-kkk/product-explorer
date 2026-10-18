import type { ProductListItem } from '@miniapp/shared';
import { ProductCard } from './ProductCard';

type ProductGridProps = {
  products: ProductListItem[];
};

/** The product card grid. `mt-auto` in the card needs the `li` to stretch. */
export function ProductGrid({ products }: ProductGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
