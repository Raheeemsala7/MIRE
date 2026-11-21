export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface ProductColorItem {
  name: string;
  code: string; // e.g. #f43f5e
  image?: string;
  _id?: string;
}

export interface ProductImageItem {
  url: string;
  publicId?: string;
  isPrimary?: boolean;
  size?: number;
  _id?: string;
}

export interface ProductVariantItem {
  sku: string;
  color: string;
  size: ProductSize;
  stockQuantity: number;
  reservedQuantity?: number;
  priceOverride?: number | null;
  _id?: string;
}

export interface ProductCategoryRef {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  category: ProductCategoryRef | string;
  brand: string;
  price: number;
  discountPrice?: number | null;
  images: ProductImageItem[];
  colors: ProductColorItem[];
  sizes: ProductSize[];
  variants: ProductVariantItem[];
  totalStock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  tags: string[];
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductsPaginatedResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Product[];
  meta: PaginationMeta;
}

export interface SingleProductResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Product;
}

export interface ProductOverviewStats {
  totalProducts: number;
  activeProducts: number;
  archivedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: ProductStatus | "";
  minPrice?: number | string;
  maxPrice?: number | string;
  isFeatured?: boolean | string;
  isNewArrival?: boolean | string;
  isBestSeller?: boolean | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sort?: string;
  admin?: boolean;
}

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: string | null;
  isActive: boolean;
  sortOrder?: number;
}

export interface CategoriesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CategoryItem[];
}
