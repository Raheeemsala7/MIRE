import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchCustomers,
  fetchCustomerById,
} from "./customers.service";

describe("Customers client service", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchCustomers builds correct query string and returns data", async () => {
    const mockData = {
      success: true,
      statusCode: 200,
      data: [{ _id: "cust-1", fullName: "Yasmin Sabry", phone: "+201011112222" }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchCustomers({
      page: 1,
      limit: 10,
      search: "Yasmin",
      sortBy: "totalSpent:desc",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/customers?page=1&limit=10&search=Yasmin&sortBy=totalSpent%3Adesc",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("fetchCustomers handles empty/default filters without extra params", async () => {
    const mockData = {
      success: true,
      statusCode: 200,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchCustomers({});

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/customers",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("fetchCustomers throws error on failed response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal server error" }),
    });

    await expect(fetchCustomers({})).rejects.toThrow("Internal server error");
  });

  it("fetchCustomerById encodes ID properly and fetches details", async () => {
    const mockDetails = {
      success: true,
      statusCode: 200,
      message: "Customer retrieved",
      data: {
        customer: { _id: "673a5e8c1b2f3a001c9d4e5f", fullName: "Nouran" },
        recentOrders: [],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDetails,
    });

    const result = await fetchCustomerById("673a5e8c1b2f3a001c9d4e5f");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/customers/673a5e8c1b2f3a001c9d4e5f",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockDetails);
  });

  it("fetchCustomerById throws on 404 or backend failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Customer not found" }),
    });

    await expect(fetchCustomerById("invalid-id")).rejects.toThrow(
      "Customer not found"
    );
  });
});
