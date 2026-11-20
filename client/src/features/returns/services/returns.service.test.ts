import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  fetchReturns,
  fetchReturnById,
  updateReturnStatus,
  inspectReturn,
  logReturnCallAttempt,
  assignReturn,
  submitReturnRequest,
  fetchCustomerDeliveredOrders,
  fetchReturnsStats,
} from "./returns.service";
import {
  RETURN_STATUSES,
  RETURN_REASONS,
  ITEM_CONDITIONS,
  CALL_ATTEMPT_RESULTS,
  REFUND_METHODS,
} from "../types/return.types";

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

  it("updateReturnStatus sends PATCH request with new status and notes", async () => {
    const mockResponse = {
      success: true,
      data: { _id: "ret-123", status: RETURN_STATUSES.RETURN_APPROVED },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const res = await updateReturnStatus("ret-123", {
      status: RETURN_STATUSES.RETURN_APPROVED,
      notes: "Approved by manager",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/returns/ret-123/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          status: RETURN_STATUSES.RETURN_APPROVED,
          notes: "Approved by manager",
        }),
      })
    );
    expect(res.data.status).toBe(RETURN_STATUSES.RETURN_APPROVED);
  });

  it("inspectReturn sends POST request with inspected items and notes", async () => {
    const mockResponse = {
      success: true,
      data: { _id: "ret-123", status: RETURN_STATUSES.INSPECTED },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const payload = {
      inspectionNotes: "Item perfect, packaging intact.",
      itemInspections: [
        {
          itemId: "item-1",
          condition: ITEM_CONDITIONS.TAGS_ATTACHED,
          restockApproved: true,
        },
      ],
    };

    const res = await inspectReturn("ret-123", payload);
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/returns/ret-123/inspect",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
    expect(res.data.status).toBe(RETURN_STATUSES.INSPECTED);
  });

  it("logReturnCallAttempt sends POST request with outcome", async () => {
    const mockResponse = {
      success: true,
      data: { _id: "ret-123" },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const payload = {
      result: CALL_ATTEMPT_RESULTS.CUSTOMER_CONFIRMED,
      notes: "Customer confirmed Monday morning pickup",
    };

    await logReturnCallAttempt("ret-123", payload);
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/returns/ret-123/call-attempt",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("assignReturn sends PATCH request with employeeId", async () => {
    const mockResponse = {
      success: true,
      data: { _id: "ret-123", assignedEmployee: "emp-99" },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await assignReturn("ret-123", { employeeId: "emp-99" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/returns/ret-123/assign",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ employeeId: "emp-99" }),
      })
    );
  });

  it("submitReturnRequest sends POST request for customer return creation", async () => {
    const mockResponse = {
      success: true,
      data: { _id: "ret-new", returnNumber: "RET-2026-0042", status: RETURN_STATUSES.RETURN_REQUESTED },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const payload = {
      originalOrderId: "ord-deliv-1",
      items: [
        {
          productId: "prod-1",
          sku: "SKU-1",
          color: "Blue",
          size: "L",
          quantity: 1,
          unitPrice: 1200,
        },
      ],
      reason: RETURN_REASONS.SIZE_TOO_SMALL,
      refundMethod: REFUND_METHODS.CASH,
    };

    const res = await submitReturnRequest(payload);
    expect(fetch).toHaveBeenCalledWith(
      "/api/returns/request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
    expect(res.data.returnNumber).toBe("RET-2026-0042");
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
      json: async () => ({ message: "Can only request returns for DELIVERED orders" }),
    } as Response);

    await expect(
      submitReturnRequest({
        originalOrderId: "ord-pending",
        items: [],
        reason: RETURN_REASONS.OTHER,
        refundMethod: REFUND_METHODS.CASH,
      })
    ).rejects.toThrow("Can only request returns for DELIVERED orders");
  });
});
