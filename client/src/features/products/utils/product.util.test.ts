import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatProductDate,
  getProductStockStatus,
  getProductStatusBadgeVariant,
  getPrimaryImageUrl,
  generateVariantSku,
  buildProductQueryParams,
} from "./product.util";

describe("product.util", () => {
  describe("buildProductQueryParams", () => {
    it("builds query string correctly with page, search, status, and sortBy", () => {
      const query = buildProductQueryParams({
        page: 2,
        limit: 10,
        search: "Dress",
        category: "cat-123",
        status: "ACTIVE",
        sortBy: "price:asc",
        admin: true,
      });

      expect(query).toContain("page=2");
      expect(query).toContain("limit=10");
      expect(query).toContain("search=Dress");
      expect(query).toContain("category=cat-123");
      expect(query).toContain("status=ACTIVE");
      expect(query).toContain("sortBy=price%3Aasc");
      expect(query).toContain("admin=true");
    });

    it("falls back to sort if sortBy is omitted", () => {
      const query = buildProductQueryParams({
        sort: "createdAt:desc",
      });
      expect(query).toContain("sortBy=createdAt%3Adesc");
    });
  });
  describe("formatCurrency", () => {
    it("formats EGP in English and Arabic locales", () => {
      const en = formatCurrency(1500, "en");
      expect(en).toContain("1,500");

      const ar = formatCurrency(1500, "ar");
      expect(ar).toBeDefined();
    });
  });

  describe("formatProductDate", () => {
    it("formats ISO date string without throwing", () => {
      const formatted = formatProductDate("2026-11-20T10:00:00.000Z", "en");
      expect(formatted).toContain("2026");
    });
  });

  describe("getProductStockStatus", () => {
    it("returns OUT_OF_STOCK when totalStock is 0 or less", () => {
      expect(
        getProductStockStatus({ totalStock: 0, lowStockThreshold: 5 })
      ).toBe("OUT_OF_STOCK");
    });

    it("returns LOW_STOCK when totalStock is equal or below lowStockThreshold", () => {
      expect(
        getProductStockStatus({ totalStock: 3, lowStockThreshold: 5 })
      ).toBe("LOW_STOCK");
      expect(
        getProductStockStatus({ totalStock: 5, lowStockThreshold: 5 })
      ).toBe("LOW_STOCK");
    });

    it("returns IN_STOCK when totalStock is above lowStockThreshold", () => {
      expect(
        getProductStockStatus({ totalStock: 12, lowStockThreshold: 5 })
      ).toBe("IN_STOCK");
    });
  });

  describe("getProductStatusBadgeVariant", () => {
    it("returns correct badge variants for statuses", () => {
      expect(getProductStatusBadgeVariant("ACTIVE")).toBe("default");
      expect(getProductStatusBadgeVariant("DRAFT")).toBe("secondary");
      expect(getProductStatusBadgeVariant("ARCHIVED")).toBe("destructive");
    });
  });

  describe("getPrimaryImageUrl", () => {
    it("returns the image marked as primary", () => {
      const images = [
        { url: "https://example.com/secondary.jpg", isPrimary: false },
        { url: "https://example.com/primary.jpg", isPrimary: true },
      ];
      expect(getPrimaryImageUrl(images)).toBe("https://example.com/primary.jpg");
    });

    it("falls back to the first image if none marked primary", () => {
      const images = [
        { url: "https://example.com/img1.jpg", isPrimary: false },
        { url: "https://example.com/img2.jpg", isPrimary: false },
      ];
      expect(getPrimaryImageUrl(images)).toBe("https://example.com/img1.jpg");
    });

    it("uses default fallback if images array is empty or undefined", () => {
      expect(getPrimaryImageUrl([])).toBe("/products/skirt/sky-blue.png");
      expect(getPrimaryImageUrl(undefined)).toBe("/products/skirt/sky-blue.png");
    });
  });

  describe("generateVariantSku", () => {
    it("constructs predictable, uppercase variant SKU", () => {
      const sku = generateVariantSku("mire-drs-001", "Rose Quartz", "M");
      expect(sku).toBe("MIRE-DRS-001-ROS-M");
    });
  });
});
