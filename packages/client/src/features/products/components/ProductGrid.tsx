import type { ProductListItem } from '@miniapp/shared';
import { ProductCard } from './ProductCard';

type ProductGridProps = {
  products: ProductListItem[];
};

/** The product card grid. The cards stretch so their price blocks line up. */
export function ProductGrid({ products }: ProductGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
