export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** The discounted price, or null when the product carries no discount. */
export function discountedPrice(product: {
  price: number;
  discountPercentage: number;
}): number | null {
  return product.discountPercentage > 0
    ? product.price * (1 - product.discountPercentage / 100)
    : null;
}
