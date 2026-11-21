import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  fetchReturns,
  fetchReturnById,
  fetchCustomerDeliveredOrders,
  fetchReturnsStats,
} from "./returns.service";

describe("Returns Service API Client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchReturns sends correct query parameters and returns parsed data", async () => {
    const mockData = {
      success: true,
      data: [{ _id: "ret-1", returnNumber: "RET-2026-0001", status: "RETURN_REQUESTED" }],
      page: 1,
      limit: 20,
      total: 1,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const res = await fetchReturns({
      page: 1,
      limit: 20,
      status: "RETURN_REQUESTED",
      search: "RET-2026",
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/admin/returns");
    expect(calledUrl).toContain("page=1");
    expect(calledUrl).toContain("limit=20");
    expect(calledUrl).toContain("status=RETURN_REQUESTED");
    expect(calledUrl).toContain("search=RET-2026");
    expect(res).toEqual(mockData);
  });

  it("fetchReturnById requests single return by encoded ID", async () => {
    const mockReturn = {
      success: true,
      data: { _id: "ret-123", returnNumber: "RET-2026-0001" },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReturn,
    } as Response);

    const res = await fetchReturnById("ret-123");
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/returns/ret-123",
      expect.objectContaining({ method: "GET" })
    );
    expect(res).toEqual(mockReturn);
  });

  it("fetchCustomerDeliveredOrders calls customer delivered orders endpoint", async () => {
    const mockOrders = {
      success: true,
      data: [
        {
          _id: "ord-1",
          orderNumber: "ORD-2026-0010",
          status: "DELIVERED",
          createdAt: "2026-11-15T00:00:00.000Z",
          items: [],
          pricing: { subtotal: 1000, shippingFee: 50, totalAmount: 1050 },
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrders,
    } as Response);

    const res = await fetchCustomerDeliveredOrders();
    expect(fetch).toHaveBeenCalledWith(
      "/api/customer/orders/delivered",
      expect.objectContaining({ method: "GET" })
    );
    expect(res.data).toHaveLength(1);
  });

  it("fetchReturnsStats retrieves real overview counts from /api/admin/returns/stats", async () => {
    const mockStats = {
      success: true,
      data: {
        total: 25,
        pending: 5,
        approved: 8,
        inTransit: 4,
        inspected: 3,
        refunded: 3,
        rejected: 2,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const res = await fetchReturnsStats();
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/returns/stats",
      expect.objectContaining({ method: "GET" })
    );
    expect(res.data.total).toBe(25);
    expect(res.data.pending).toBe(5);
  });

  it("throws descriptive error when API responds with error status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Backend error" }),
    } as Response);

    await expect(fetchReturnById("ret-err")).rejects.toThrow("Backend error");
  });
});
