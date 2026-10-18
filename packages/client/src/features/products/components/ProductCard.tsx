import type { ProductListItem } from '@miniapp/shared';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { discountedPrice, currency } from '@/shared/lib/format';
import { ProductImage } from './ProductImage';
import { StarIcon } from './StarIcon';

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const discounted = discountedPrice(product);

  return (
    <Card className="group h-full overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <ProductImage
          src={product.thumbnail}
          alt={product.title}
          className="aspect-square w-full bg-muted object-cover"
        />
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 p-3">
        <Badge variant="secondary" className="w-fit capitalize">
          {product.category}
        </Badge>

        <Link
          to={`/products/${product.id}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
        >
          {product.title}
        </Link>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-semibold text-foreground" data-testid="product-price">
            {currency.format(discounted ?? product.price)}
          </span>
          {discounted !== null && (
            <>
              <span
                data-testid="product-price-original"
                className="text-xs text-muted-foreground line-through"
              >
                {currency.format(product.price)}
              </span>
              <Badge
                data-testid="product-discount"
                className="border-transparent bg-green-100 text-xs text-green-700"
              >
                -{Math.round(product.discountPercentage)}%
              </Badge>
            </>
          )}
        </div>

        <span
          className="flex items-center gap-1 text-xs text-muted-foreground"
          data-testid="product-rating"
        >
          <StarIcon className="h-4 w-4 text-yellow-500" />
          {product.rating.toFixed(1)}
        </span>
      </CardContent>
    </Card>
  );
}
