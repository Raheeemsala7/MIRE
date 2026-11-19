import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAnalyticsDashboard,
  fetchRecentOrders,
  fetchLowStockAlerts,
} from "./analytics.service";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analytics client service", () => {
  it("fetches dashboard data using query params and returns parsed payload", async () => {
    const mockData = {
      success: true,
      data: {
        overview: {
          totalRevenue: 2400,
          todayRevenue: 500,
          totalOrders: 4,
          newOrders: 2,
          pendingOrders: 1,
          deliveredOrders: 1,
          cancelledOrders: 0,
          returnedOrders: 0,
          totalCustomers: 10,
          averageOrderValue: 600,
          returnRate: "0%",
          deliverySuccessRate: "100%",
        },
        charts: {
          dailyRevenue: [],
          ordersByStatus: [],
          salesByCategory: [],
          bestSellers: [],
          paymentDistribution: [],
        },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(Response.json(mockData));
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchAnalyticsDashboard({ range: "7d" });
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/analytics?range=7d");
    expect(result.overview.totalRevenue).toBe(2400);
  });

  it("fetches recent orders", async () => {
    const mockOrders = [
      {
        _id: "order-1",
        orderNumber: "1001",
        customerInfo: { fullName: "Amira" },
        pricing: { totalAmount: 1200 },
        paymentInfo: { method: "COD", status: "PAID" },
        status: "DELIVERED",
        createdAt: "2026-11-19T10:00:00Z",
        itemsCount: 2,
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue(Response.json({ success: true, data: mockOrders }));
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchRecentOrders();
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/orders/recent?limit=6");
    expect(result.length).toBe(1);
    expect(result[0].orderNumber).toBe("1001");
  });

  it("fetches low stock alerts", async () => {
    const mockLowStock = [
      {
        productId: "p1",
        productName: "Silk Abaya",
        productSku: "ABY-01",
        category: "Abayas",
        variantSku: "ABY-01-M",
        color: "Black",
        size: "M",
        stockQuantity: 2,
        threshold: 5,
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue(Response.json({ success: true, data: mockLowStock }));
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchLowStockAlerts();
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/inventory/low-stock");
    expect(result.length).toBe(1);
    expect(result[0].stockQuantity).toBe(2);
  });
});
