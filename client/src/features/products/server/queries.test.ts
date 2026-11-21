import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminProducts,
  getAdminProductById,
  getAdminProductOverviewStats,
  getPublicProducts,
  getPublicProductBySlug,
  getPublicRelatedProducts,
  getCategories,
} from "./queries";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => ({
  serverApiGet: vi.fn(),
}));

vi.mock("@/lib/auth/backend-client", () => ({
  apiUrl: vi.fn(() => "http://localhost:5000/api/v1"),
  BackendApiError: class BackendApiError extends Error {
    constructor(public status: number, public data?: unknown) {
      super("Backend API Error");
    }
  },
}));

import { serverApiGet } from "@/lib/auth/session";

describe("Product Server Queries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getAdminProducts", () => {
    it("appends admin=true and query params to request path", async () => {
      vi.mocked(serverApiGet).mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "Success",
        data: [],
      });

      await getAdminProducts({ page: 2, limit: 10, status: "ACTIVE" });

      expect(serverApiGet).toHaveBeenCalledWith(
        "/products?page=2&limit=10&status=ACTIVE&admin=true"
      );
    });
  });

  describe("getAdminProductById", () => {
    it("fetches single product with encoded ID", async () => {
      vi.mocked(serverApiGet).mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "Success",
        data: { _id: "prod-123" },
      });

      await getAdminProductById("prod-123");
      expect(serverApiGet).toHaveBeenCalledWith("/products/prod-123");
    });
  });

  describe("getAdminProductOverviewStats", () => {
    it("derives real lowStock and outOfStock counts from inventory items", async () => {
      vi.mocked(serverApiGet).mockImplementation(async <T>(path: string): Promise<T> => {
        if (path === "/products?limit=1&admin=true") {
          return { success: true, meta: { total: 50 } } as unknown as T;
        }
        if (path === "/products?limit=1&status=ACTIVE&admin=true") {
          return { success: true, meta: { total: 42 } } as unknown as T;
        }
        if (path === "/products?limit=1&status=ARCHIVED&admin=true") {
          return { success: true, meta: { total: 8 } } as unknown as T;
        }
        if (path === "/inventory/low-stock") {
          return {
            success: true,
            data: [
              { variantSku: "SKU-A", stockQuantity: 3, threshold: 5 },
              { variantSku: "SKU-B", stockQuantity: 0, threshold: 5 },
              { variantSku: "SKU-C", stockQuantity: 2, threshold: 5 },
            ],
          } as unknown as T;
        }
        return { success: true } as unknown as T;
      });

      const stats = await getAdminProductOverviewStats();

      expect(stats.totalProducts).toBe(50);
      expect(stats.activeProducts).toBe(42);
      expect(stats.archivedProducts).toBe(8);
      expect(stats.lowStockProducts).toBe(2);
      expect(stats.outOfStockProducts).toBe(1);
    });
  });

  describe("Public product queries (storefront)", () => {
    it("fetches public products with correct revalidation tags", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await getPublicProducts({ category: "dresses" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/v1/products?category=dresses",
        expect.objectContaining({
          next: expect.objectContaining({
            tags: ["products"],
            revalidate: 60,
          }),
        })
      );
    });

    it("fetches public product by slug with slug-specific cache tag", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { slug: "rose-satin-dress" } }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await getPublicProductBySlug("rose-satin-dress");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/v1/products/slug/rose-satin-dress",
        expect.objectContaining({
          next: expect.objectContaining({
            tags: ["products", "product-slug-rose-satin-dress"],
            revalidate: 60,
          }),
        })
      );
    });

    it("fetches related products by ID", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await getPublicRelatedProducts("prod-1", 3);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/v1/products/prod-1/related?limit=3",
        expect.objectContaining({
          next: expect.objectContaining({
            tags: ["products", "product-related-prod-1"],
            revalidate: 60,
          }),
        })
      );
    });

    it("fetches categories from backend API", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ _id: "cat-1", name: "Dresses", slug: "dresses" }],
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const categories = await getCategories();
      expect(categories).toEqual([{ _id: "cat-1", name: "Dresses", slug: "dresses" }]);
    });
  });
});
