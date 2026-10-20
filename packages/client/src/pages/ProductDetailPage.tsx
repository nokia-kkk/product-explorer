import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductNotFoundError } from '../features/products/api/products';
import { useProduct } from '../features/products/hooks/useProduct';
import { ProductDetailSkeleton } from '../features/products/components/ProductDetailSkeleton';
import { ProductGallery } from '../features/products/components/ProductGallery';
import { StarIcon } from '../features/products/components/StarIcon';
import { currency, discountedPrice } from '../shared/lib/format';

const backLink = (
  <Link
    to="/"
    className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
  >
    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
    Back to products
  </Link>
);

export function ProductDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const product = useProduct(id);

  const discounted = product.data ? discountedPrice(product.data) : null;

  return (
    <section className="flex flex-col gap-6">
      {backLink}

      {product.isLoading && <ProductDetailSkeleton />}

      {product.isError &&
        (product.error instanceof ProductNotFoundError ? (
          <div
            data-testid="product-not-found"
            className="flex flex-col items-center gap-2 rounded-md border border-border bg-card px-6 py-20 text-center"
          >
            <h1 className="font-display text-2xl text-foreground">Product not found</h1>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              This product does not exist or is no longer available.
            </p>
          </div>
        ) : (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/25 border-l-2 border-l-destructive bg-destructive/[0.04] px-4 py-3 text-sm text-foreground"
          >
            <span className="mr-auto">Failed to load product. Please try again.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => product.refetch()}>
              Retry
            </Button>
          </div>
        ))}

      {product.data && (
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <ProductGallery
            key={product.data.id}
            title={product.data.title}
            thumbnail={product.data.thumbnail}
            images={product.data.images}
          />

          <div className="flex flex-col gap-4 md:pt-1">
            <Badge variant="secondary" className="w-fit capitalize">
              {product.data.category}
            </Badge>

            <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
              {product.data.title}
            </h1>

            <span
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
              data-testid="product-rating"
            >
              <StarIcon className="h-4 w-4 text-sale" />
              <span aria-label={`Rating: ${product.data.rating.toFixed(1)} out of 5`}>
                {product.data.rating.toFixed(1)}
              </span>
            </span>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-border py-4">
              <span
                className="price-block text-3xl leading-none text-foreground"
                data-testid="product-price"
              >
                {currency.format(discounted ?? product.data.price)}
              </span>
              {discounted !== null && (
                <>
                  <span
                    data-testid="product-price-original"
                    className="text-sm text-muted-foreground line-through"
                  >
                    {currency.format(product.data.price)}
                  </span>
                  <Badge variant="outline" className="border-sale/25 bg-sale/10 text-xs text-sale">
                    -{Math.round(product.data.discountPercentage)}%
                  </Badge>
                </>
              )}
            </div>

            {product.data.stock === 0 ? (
              <span
                data-testid="out-of-stock-badge"
                className="w-fit rounded-sm bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
              >
                Out of stock
              </span>
            ) : (
              <span
                data-testid="product-stock"
                className="w-fit rounded-sm bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
              >
                In stock ({product.data.stock} available)
              </span>
            )}

            {product.data.brand && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Brand:</span> {product.data.brand}
              </p>
            )}

            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {product.data.description}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
