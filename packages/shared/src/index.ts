/** Sorts supported by the product list API. */
export const PRODUCT_SORT_FIELDS = ['name', 'price', 'rating'] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

/** Sort directions supported by the product list API. */
export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/** The largest page the product list API will serve. */
export const PRODUCT_LIST_MAX_LIMIT = 100;

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

/** A category with the number of products filed under it. */
export interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

export interface ProductListItem {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  rating: number;
  thumbnail: string;
  brand: string;
  category: string;
}

export interface ProductListResponse {
  data: ProductListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export interface ProductDetailResponse {
  data: Product;
}

export interface CategoryListResponse {
  data: CategoryWithCount[];
  meta: {
    total: number;
  };
}
