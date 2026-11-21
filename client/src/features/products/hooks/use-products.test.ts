import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { productQueryKeys } from "./use-products";
import * as service from "../services/products.service";
import type { ProductsPaginatedResponse, ProductFilters } from "../types/product.types";

vi.mock("../services/products.service", () => ({
  fetchAdminProducts: vi.fn(),
}));

const mockPage1Data: ProductsPaginatedResponse = {
  success: true,
  statusCode: 200,
  message: "Success",
  data: [
    {
      _id: "prod-1",
      name: "Product Page 1",
      slug: "product-1",
      sku: "SKU-1",
      description: "Desc 1",
      category: "cat-1",
      brand: "MIRE",
      price: 100,
      totalStock: 10,
      lowStockThreshold: 5,
      status: "ACTIVE",
      variants: [],
      sizes: ["S"],
      colors: [],
      images: [],
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      tags: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ],
  meta: {
    page: 1,
    limit: 20,
    total: 40,
    totalPages: 2,
    hasNextPage: true,
    hasPrevPage: false,
  },
};

const mockPage2Data: ProductsPaginatedResponse = {
  success: true,
  statusCode: 200,
  message: "Success",
  data: [
    {
      _id: "prod-2",
      name: "Product Page 2",
      slug: "product-2",
      sku: "SKU-2",
      description: "Desc 2",
      category: "cat-1",
      brand: "MIRE",
      price: 200,
      totalStock: 20,
      lowStockThreshold: 5,
      status: "ACTIVE",
      variants: [],
      sizes: ["M"],
      colors: [],
      images: [],
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: true,
      tags: [],
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
    },
  ],
  meta: {
    page: 2,
    limit: 20,
    total: 40,
    totalPages: 2,
    hasNextPage: false,
    hasPrevPage: true,
  },
};

describe("useProducts query key & cache behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates distinct query keys for different filter configurations", () => {
    const key1 = productQueryKeys.list({ page: 1, limit: 20 });
    const key2 = productQueryKeys.list({ page: 2, limit: 20 });
    const keySearch = productQueryKeys.list({ search: "dress" });

    expect(key1).toEqual(["admin", "products", "list", { page: 1, limit: 20 }]);
    expect(key2).toEqual(["admin", "products", "list", { page: 2, limit: 20 }]);
    expect(keySearch).toEqual(["admin", "products", "list", { search: "dress" }]);
    expect(key1).not.toEqual(key2);
  });

  it("populates initial data only for the matching initial filter key and fetches for page 2", async () => {
    const queryClient = new QueryClient();
    vi.mocked(service.fetchAdminProducts).mockResolvedValue(mockPage2Data);

    const initialFilters: ProductFilters = { page: 1, limit: 20 };
    const page1Key = productQueryKeys.list(initialFilters);

    // Initial page load seed
    queryClient.setQueryData(page1Key, mockPage1Data);
    expect(queryClient.getQueryData(page1Key)).toEqual(mockPage1Data);

    // Page 2 navigation must have empty cache initially and execute fetchAdminProducts
    const page2Filters: ProductFilters = { page: 2, limit: 20 };
    const page2Key = productQueryKeys.list(page2Filters);
    expect(queryClient.getQueryData(page2Key)).toBeUndefined();

    const result = await queryClient.fetchQuery({
      queryKey: page2Key,
      queryFn: () => service.fetchAdminProducts(page2Filters),
    });

    expect(result).toEqual(mockPage2Data);
    expect(service.fetchAdminProducts).toHaveBeenCalledWith(page2Filters);
  });
});
