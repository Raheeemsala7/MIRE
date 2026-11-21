import { describe, expect, it } from "vitest";
import {
  analyticsFilterSchema,
  analyticsResponseSchema,
  dashboardOverviewSchema,
} from "./analytics.schema";

describe("analytics validation schemas", () => {
  it("defaults filter range to 30d", () => {
    const parsed = analyticsFilterSchema.parse({});
    expect(parsed.range).toBe("30d");
  });

  it("accepts valid ranges and dates", () => {
    const parsed = analyticsFilterSchema.parse({
      range: "custom",
      startDate: "2026-11-01",
      endDate: "2026-11-20",
    });
    expect(parsed.range).toBe("custom");
    expect(parsed.startDate).toBe("2026-11-01");
  });

  it("validates and defaults dashboard overview numbers", () => {
    const parsed = dashboardOverviewSchema.parse({
      totalRevenue: 5000,
      totalOrders: 12,
    });
    expect(parsed.totalRevenue).toBe(5000);
    expect(parsed.todayRevenue).toBe(0);
    expect(parsed.returnRate).toBe("0%");
  });

  it("handles valid zero-value metrics without falling back to missing data", () => {
    const parsed = dashboardOverviewSchema.parse({
      totalRevenue: 0,
      todayRevenue: 0,
      totalOrders: 0,
      newOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      returnedOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      returnRate: "0%",
      deliverySuccessRate: "0%",
    });
    expect(parsed.totalRevenue).toBe(0);
    expect(parsed.totalOrders).toBe(0);
    expect(parsed.totalCustomers).toBe(0);
    expect(parsed.averageOrderValue).toBe(0);
  });

  it("validates full backend analytics response structure", () => {
    const mockBackendData = {
      success: true,
      data: {
        overview: {
          totalRevenue: 1950,
          todayRevenue: 0,
          totalOrders: 3,
          newOrders: 1,
          pendingOrders: 0,
          deliveredOrders: 1,
          cancelledOrders: 0,
          returnedOrders: 1,
          totalCustomers: 7,
          averageOrderValue: 1950,
          returnRate: "33.3%",
          deliverySuccessRate: "33.3%",
        },
        charts: {
          dailyRevenue: [{ _id: "2026-11-12", revenue: 1950, orders: 1 }],
          ordersByStatus: [{ status: "DELIVERED", count: 1 }],
          salesByCategory: [{ category: "Evening Dresses", revenue: 2150, count: 1 }],
          bestSellers: [
            {
              _id: "6afb62e53f8844e4d2513594",
              name: "Aurelia Gown",
              sku: "MIRE-DRS-001",
              totalSold: 1,
              totalRevenue: 2150,
            },
          ],
          paymentDistribution: [{ method: "STRIPE", count: 1, revenue: 1950 }],
        },
      },
    };

    const parsed = analyticsResponseSchema.safeParse(mockBackendData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data.overview.totalRevenue).toBe(1950);
      expect(parsed.data.data.charts.bestSellers[0].name).toBe("Aurelia Gown");
    }
  });
});
