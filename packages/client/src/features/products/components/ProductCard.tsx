import type { ProductListItem } from '@miniapp/shared';
import { Link } from 'react-router-dom';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { discountedPrice, currency } from '@/shared/lib/format';
import { cn } from '@/lib/utils';
import { ProductImage } from './ProductImage';
import { StarIcon } from './StarIcon';

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const discounted = discountedPrice(product);

  return (
    <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-primary/40">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <ProductImage
          src={product.thumbnail}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {discounted !== null && (
          <Badge
            data-testid="product-discount"
            className="absolute left-2.5 top-2.5 bg-sale text-primary-foreground hover:bg-sale"
          >
            -{Math.round(product.discountPercentage)}%
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <Link
          to={`/categories/${product.categorySlug}`}
          aria-label={`Browse ${product.category}`}
          className={cn('relative z-10 w-fit capitalize', badgeVariants({ variant: 'secondary' }))}
        >
          {product.category}
        </Link>

        <h2 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {product.title}
        </h2>

        <span
          className="flex items-center gap-1 text-xs text-muted-foreground"
          data-testid="product-rating"
        >
          <StarIcon className="h-3.5 w-3.5 text-sale" />
          {product.rating.toFixed(1)}
        </span>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-border pt-2.5">
          <span
            className="price-block text-lg leading-none text-foreground"
            data-testid="product-price"
          >
            {currency.format(discounted ?? product.price)}
          </span>
          {discounted !== null && (
            <span
              data-testid="product-price-original"
              className="text-xs text-muted-foreground line-through"
            >
              {currency.format(product.price)}
            </span>
          )}
        </div>
      </div>

      {/* The product link is an empty overlay stretched across the card, and the
          category badge sits above it on its own link. Keeps both clickable
          without nesting anchors, and leaves the layout exactly as it was. */}
      <Link
        to={`/products/${product.id}`}
        aria-label={product.title}
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
    </div>
  );
}
