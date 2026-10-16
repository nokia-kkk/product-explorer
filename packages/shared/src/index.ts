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

export interface Category {
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

export interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  productCount: number;
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
