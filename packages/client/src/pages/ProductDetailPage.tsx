import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductNotFoundError } from '../features/products/api/products';
import { useProduct } from '../features/products/hooks/useProduct';
import { ProductDetailSkeleton } from '../features/products/components/ProductDetailSkeleton';
import { ProductGallery } from '../features/products/components/ProductGallery';
import { StarIcon } from '../features/products/components/StarIcon';
import { currency, discountedPrice } from '../shared/lib/format';

const backLink = (
  <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
    ← Back to products
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
            className="flex flex-col items-center gap-2 rounded-lg border bg-card px-4 py-16 text-center"
          >
            <h1 className="text-lg font-semibold text-foreground">Product not found</h1>
            <p className="text-sm text-muted-foreground">
              This product does not exist or is no longer available.
            </p>
          </div>
        ) : (
          <div
            role="alert"
            className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <span>Failed to load product. Please try again.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-destructive/40 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => product.refetch()}
            >
              Retry
            </Button>
          </div>
        ))}

      {product.data && (
        <div className="grid gap-8 md:grid-cols-2">
          <ProductGallery
            key={product.data.id}
            title={product.data.title}
            thumbnail={product.data.thumbnail}
            images={product.data.images}
          />

          <div className="flex flex-col gap-4">
            <Badge variant="secondary" className="w-fit capitalize">
              {product.data.category}
            </Badge>

            <h1 className="text-2xl font-semibold text-foreground">{product.data.title}</h1>

            <span
              className="flex items-center gap-1 text-sm text-muted-foreground"
              data-testid="product-rating"
            >
              <StarIcon className="h-4 w-4 text-yellow-500" />
              <span aria-label={`Rating: ${product.data.rating.toFixed(1)} out of 5`}>
                {product.data.rating.toFixed(1)}
              </span>
            </span>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-foreground" data-testid="product-price">
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
                  <Badge className="border-transparent bg-green-100 text-xs text-green-700">
                    -{Math.round(product.data.discountPercentage)}%
                  </Badge>
                </>
              )}
            </div>

            {product.data.stock === 0 ? (
              <span
                data-testid="out-of-stock-badge"
                className="w-fit rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
              >
                Out of stock
              </span>
            ) : (
              <span
                data-testid="product-stock"
                className="w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
              >
                In stock ({product.data.stock} available)
              </span>
            )}

            {product.data.brand && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Brand:</span> {product.data.brand}
              </p>
            )}

            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.data.description}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
