import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAdminProducts,
  fetchAdminProductById,
} from "./products.service";

describe("Products client service", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchAdminProducts builds query string and returns data", async () => {
    const mockData = {
      success: true,
      statusCode: 200,
      data: [{ _id: "1", name: "Dress", sku: "MIRE-001" }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchAdminProducts({
      page: 1,
      limit: 10,
      search: "Dress",
      category: "cat-1",
      status: "ACTIVE",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/products?page=1&limit=10&search=Dress&category=cat-1&status=ACTIVE",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("fetchAdminProducts handles error responses", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal server error" }),
    });

    await expect(fetchAdminProducts()).rejects.toThrow(
      "Internal server error"
    );
  });

  it("fetchAdminProductById fetches product by ID", async () => {
    const mockProduct = {
      success: true,
      statusCode: 200,
      data: { _id: "prod-1", name: "Dress" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProduct,
    });

    const result = await fetchAdminProductById("prod-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/products/prod-1",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockProduct);
  });
});
