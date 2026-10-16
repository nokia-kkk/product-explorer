import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ProductDetailResponse } from '@shared/types';
import { fetchProduct, ProductNotFoundError } from '../lib/api';
import { currency, discountedPrice } from '../lib/format';
import ProductGallery from '../components/ProductGallery';
import StarIcon from '../components/StarIcon';

const backLink = (
  <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
    ← Back to products
  </Link>
);

export default function ProductDetailPage() {
  const { id = '' } = useParams<{ id: string }>();

  const productQuery = useQuery<ProductDetailResponse>({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
  });

  const product = productQuery.data?.data;
  const discounted = product ? discountedPrice(product) : null;

  return (
    <section className="flex flex-col gap-6">
      {backLink}

      {productQuery.isPending && (
        <div
          data-testid="product-detail-skeleton"
          aria-busy="true"
          aria-label="Loading product"
          className="grid gap-8 md:grid-cols-2"
        >
          <div className="aspect-square w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="flex flex-col gap-3">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-1/4 animate-pulse rounded bg-gray-200" />
            <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      )}

      {productQuery.isError &&
        (productQuery.error instanceof ProductNotFoundError ? (
          <div
            data-testid="product-not-found"
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-16 text-center"
          >
            <h1 className="text-lg font-semibold text-gray-900">Product not found</h1>
            <p className="text-sm text-gray-600">
              This product does not exist or is no longer available.
            </p>
          </div>
        ) : (
          <div
            role="alert"
            className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>Failed to load product. Please try again.</span>
            <button
              type="button"
              className="rounded-md border border-red-300 bg-white px-3 py-1 text-red-700 hover:bg-red-100"
              onClick={() => productQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ))}

      {product && (
        <div className="grid gap-8 md:grid-cols-2">
          <ProductGallery
            key={product.id}
            title={product.title}
            thumbnail={product.thumbnail}
            images={product.images}
          />

          <div className="flex flex-col gap-4">
            <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
              {product.category}
            </span>

            <h1 className="text-2xl font-semibold text-gray-900">{product.title}</h1>

            <span
              className="flex items-center gap-1 text-sm text-gray-600"
              data-testid="product-rating"
            >
              <StarIcon className="h-4 w-4 text-yellow-500" />
              <span aria-label={`Rating: ${product.rating.toFixed(1)} out of 5`}>
                {product.rating.toFixed(1)}
              </span>
            </span>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900" data-testid="product-price">
                {currency.format(discounted ?? product.price)}
              </span>
              {discounted !== null && (
                <>
                  <span
                    data-testid="product-price-original"
                    className="text-sm text-gray-400 line-through"
                  >
                    {currency.format(product.price)}
                  </span>
                  <span className="rounded bg-green-100 px-1.5 text-xs font-medium text-green-700">
                    -{Math.round(product.discountPercentage)}%
                  </span>
                </>
              )}
            </div>

            {product.stock === 0 ? (
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
                In stock ({product.stock} available)
              </span>
            )}

            {product.brand && (
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Brand:</span> {product.brand}
              </p>
            )}

            <p className="text-sm leading-relaxed text-gray-700">{product.description}</p>
          </div>
        </div>
      )}
    </section>
  );
}
