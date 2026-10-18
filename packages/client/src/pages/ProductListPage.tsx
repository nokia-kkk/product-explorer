import { ProductBrowser } from '../features/products/components/ProductBrowser';

/** Route-level only: the browser owns the params, data and layout below it. */
export function ProductListPage() {
  return <ProductBrowser title="Products" />;
}
