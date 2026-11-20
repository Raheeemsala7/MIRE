import { describe, expect, it } from "vitest";
import {
  formatCustomerDate,
  formatCustomerCurrency,
  calculateCustomerMetrics,
  getOrderStatusBadgeVariant,
  getPaymentStatusBadgeVariant,
} from "./customer.util";
import type { Customer } from "../types/customer.types";

describe("customer.util", () => {
  describe("formatCustomerDate", () => {
    it("formats valid ISO date in English and Arabic", () => {
      const dateStr = "2026-03-15T12:00:00.000Z";
      const en = formatCustomerDate(dateStr, "en");
      const ar = formatCustomerDate(dateStr, "ar");

      expect(en).toContain("2026");
      expect(en).toContain("Mar");
      expect(ar).toContain("مارس");
    });

    it("returns placeholder on null or invalid date", () => {
      expect(formatCustomerDate(null)).toBe("—");
      expect(formatCustomerDate(undefined)).toBe("—");
      expect(formatCustomerDate("not-a-date")).toBe("—");
    });
  });

  describe("formatCustomerCurrency", () => {
    it("formats numbers as EGP in English and Arabic", () => {
      const en = formatCustomerCurrency(1250, "en");
      const ar = formatCustomerCurrency(1250, "ar");

      expect(en).toBe("EGP 1,250");
      expect(ar).toContain("ج.م");
    });

    it("handles 0 and undefined amounts safely", () => {
      expect(formatCustomerCurrency(0, "en")).toBe("EGP 0");
      expect(formatCustomerCurrency(undefined, "en")).toBe("EGP 0");
      expect(formatCustomerCurrency(null, "ar")).toContain("0");
    });
  });

  describe("calculateCustomerMetrics", () => {
    const sampleCustomers: Customer[] = [
      {
        _id: "1",
        fullName: "Nour",
        phone: "+201011112222",
        addresses: [],
        totalOrders: 3,
        totalSpent: 4500,
        tags: ["VIP"],
        notes: "",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        _id: "2",
        fullName: "Yasmin",
        phone: "+201033334444",
        addresses: [],
        totalOrders: 0,
        totalSpent: 0,
        tags: [],
        notes: "",
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-01-15T00:00:00.000Z",
      },
    ];

    it("calculates totals, buyers with orders, and spend sum", () => {
      const metrics = calculateCustomerMetrics(sampleCustomers, {
        total: 25,
        totalPages: 2,
        page: 1,
      });
      expect(metrics.total).toBe(25);
      expect(metrics.totalPages).toBe(2);
      expect(metrics.currentPage).toBe(1);
      expect(metrics.pageCount).toBe(2);
      expect(metrics.withOrdersInView).toBe(1);
      expect(metrics.totalSpentInView).toBe(4500);
    });
  });

  describe("getOrderStatusBadgeVariant", () => {
    it("maps order statuses to appropriate badge variants", () => {
      expect(getOrderStatusBadgeVariant("DELIVERED")).toBe("default");
      expect(getOrderStatusBadgeVariant("PROCESSING")).toBe("secondary");
      expect(getOrderStatusBadgeVariant("SHIPPED")).toBe("secondary");
      expect(getOrderStatusBadgeVariant("CANCELLED")).toBe("destructive");
      expect(getOrderStatusBadgeVariant("RETURNED")).toBe("destructive");
      expect(getOrderStatusBadgeVariant("NEW")).toBe("outline");
    });
  });

  describe("getPaymentStatusBadgeVariant", () => {
    it("maps payment statuses to appropriate badge variants", () => {
      expect(getPaymentStatusBadgeVariant("PAID")).toBe("default");
      expect(getPaymentStatusBadgeVariant("PENDING")).toBe("secondary");
      expect(getPaymentStatusBadgeVariant("FAILED")).toBe("destructive");
      expect(getPaymentStatusBadgeVariant("CANCELLED")).toBe("destructive");
      expect(getPaymentStatusBadgeVariant("REFUNDED")).toBe("outline");
    });
  });
});
