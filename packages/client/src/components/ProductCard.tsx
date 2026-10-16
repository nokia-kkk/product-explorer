import type { ProductListItem } from '@shared/types';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import StarIcon from './StarIcon';
import { currency, discountedPrice } from '../lib/format';

type ProductCardProps = {
  product: ProductListItem;
};

export default function ProductCard({ product }: ProductCardProps) {
  const discounted = discountedPrice(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <ProductImage
          src={product.thumbnail}
          alt={product.title}
          className="aspect-square w-full bg-gray-100 object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
          {product.category}
        </span>

        <Link
          to={`/products/${product.id}`}
          className="line-clamp-2 text-sm font-medium text-gray-900 hover:underline"
        >
          {product.title}
        </Link>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-900" data-testid="product-price">
            {currency.format(discounted ?? product.price)}
          </span>
          {discounted !== null && (
            <>
              <span
                data-testid="product-price-original"
                className="text-xs text-gray-400 line-through"
              >
                {currency.format(product.price)}
              </span>
              <span
                data-testid="product-discount"
                className="rounded bg-green-100 px-1.5 text-xs font-medium text-green-700"
              >
                -{Math.round(product.discountPercentage)}%
              </span>
            </>
          )}
        </div>

        <span
          className="flex items-center gap-1 text-xs text-gray-600"
          data-testid="product-rating"
        >
          <StarIcon className="h-4 w-4 text-yellow-500" />
          {product.rating.toFixed(1)}
        </span>
      </div>
    </article>
  );
}
