import type { Product } from "@/features/products/types/product.types";

export type StockAdjustmentType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE";

export type InventoryMovementType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "RESERVATION"
  | "RELEASE";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface LowStockItem {
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  variantSku: string;
  color: string;
  size: string;
  stockQuantity: number;
  threshold: number;
}

export interface InventoryMovementProduct {
  _id: string;
  name: string;
  sku: string;
  images?: Array<{
    url: string;
    isPrimary?: boolean;
    publicId?: string;
  }>;
}

export interface InventoryMovementPerformedBy {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface InventoryMovementReferenceOrder {
  _id: string;
  orderNumber: string;
  status: string;
}

export interface InventoryMovementItem {
  _id: string;
  product: InventoryMovementProduct | string;
  variantSku: string;
  color: string;
  size: string;
  type: InventoryMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceOrder?: InventoryMovementReferenceOrder | null;
  performedBy?: InventoryMovementPerformedBy | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovementsFilterParams {
  page?: number;
  limit?: number;
  productId?: string;
  variantSku?: string;
  type?: string;
  sort?: string;
  sortBy?: string;
}

export interface InventoryMovementsPaginatedResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: InventoryMovementItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface LowStockPaginatedResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: LowStockItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AdjustStockPayload {
  productId: string;
  variantSku: string;
  quantityChange: number;
  type: StockAdjustmentType;
  reason: string;
}

export interface AdjustStockResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    product: Product;
    movement: InventoryMovementItem;
  };
}

export interface InventoryOverviewStats {
  lowStockCount: number;
  outOfStockCount: number;
  totalMovements: number;
  replenishmentProductsCount: number;
}
