import { describe, it, expect } from "vitest";
import {
  determineStockStatus,
  formatQuantityChange,
  calculateOverviewStats,
  calculateReplenishmentUnits,
  buildMovementsQueryParams,
} from "../utils/inventory.util";
import { adjustStockSchema } from "../schemas/inventory.schema";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS, PERMISSION_BACKEND_MAP } from "@/config/rbac.config";

describe("Inventory Utilities", () => {
  describe("determineStockStatus", () => {
    it("returns OUT_OF_STOCK when stock is 0", () => {
      expect(determineStockStatus(0, 5)).toBe("OUT_OF_STOCK");
    });

    it("returns OUT_OF_STOCK when stock is negative", () => {
      expect(determineStockStatus(-2, 5)).toBe("OUT_OF_STOCK");
    });

    it("returns LOW_STOCK when stock is at or below threshold", () => {
      expect(determineStockStatus(5, 5)).toBe("LOW_STOCK");
      expect(determineStockStatus(3, 5)).toBe("LOW_STOCK");
    });

    it("returns IN_STOCK when stock is above threshold", () => {
      expect(determineStockStatus(6, 5)).toBe("IN_STOCK");
      expect(determineStockStatus(100, 5)).toBe("IN_STOCK");
    });
  });

  describe("calculateReplenishmentUnits", () => {
    it("calculates required units when out of stock", () => {
      expect(calculateReplenishmentUnits(0, 5)).toBe(6);
      expect(calculateReplenishmentUnits(-2, 5)).toBe(6);
    });

    it("calculates required units when below threshold", () => {
      expect(calculateReplenishmentUnits(2, 5)).toBe(4);
      expect(calculateReplenishmentUnits(4, 5)).toBe(2);
    });

    it("calculates required units when exactly at threshold", () => {
      expect(calculateReplenishmentUnits(5, 5)).toBe(1);
    });

    it("returns 0 when stock is safely above threshold", () => {
      expect(calculateReplenishmentUnits(6, 5)).toBe(0);
      expect(calculateReplenishmentUnits(50, 5)).toBe(0);
    });
  });

  describe("formatQuantityChange", () => {
    it("formats positive quantity with leading plus sign in English", () => {
      const result = formatQuantityChange(10, "en");
      expect(result).toBe("+10");
    });

    it("formats negative quantity with minus sign in English", () => {
      const result = formatQuantityChange(-5, "en");
      expect(result).toBe("-5");
    });

    it("formats positive and negative numbers in Arabic locale", () => {
      const resultPos = formatQuantityChange(10, "ar");
      const resultNeg = formatQuantityChange(-5, "ar");
      expect(resultPos).toContain("+");
      expect(resultNeg).toContain("-");
    });
  });

  describe("calculateOverviewStats", () => {
    it("correctly calculates overview totals from real API items", () => {
      const items = [
        {
          productId: "p1",
          productName: "Linen Abaya",
          productSku: "ABY-01",
          category: "Abayas",
          variantSku: "ABY-01-BLK-M",
          color: "Black",
          size: "M",
          stockQuantity: 0,
          threshold: 5,
        },
        {
          productId: "p1",
          productName: "Linen Abaya",
          productSku: "ABY-01",
          category: "Abayas",
          variantSku: "ABY-01-BLK-L",
          color: "Black",
          size: "L",
          stockQuantity: 2,
          threshold: 5,
        },
        {
          productId: "p2",
          productName: "Silk Hijab",
          productSku: "HJB-01",
          category: "Hijabs",
          variantSku: "HJB-01-SLV-STD",
          color: "Silver",
          size: "STD",
          stockQuantity: 4,
          threshold: 10,
        },
      ];

      const stats = calculateOverviewStats(items, 42);

      expect(stats.outOfStockCount).toBe(1); // 1 item with stock === 0
      expect(stats.lowStockCount).toBe(2); // 2 items with 0 < stock <= threshold
      expect(stats.replenishmentProductsCount).toBe(2); // 2 distinct products: p1 and p2
      expect(stats.totalMovements).toBe(42);
    });

    it("handles empty array gracefully", () => {
      const stats = calculateOverviewStats([], 0);
      expect(stats.outOfStockCount).toBe(0);
      expect(stats.lowStockCount).toBe(0);
      expect(stats.replenishmentProductsCount).toBe(0);
      expect(stats.totalMovements).toBe(0);
    });
  });

  describe("buildMovementsQueryParams", () => {
    it("serializes all provided parameters with backend sortBy key", () => {
      const query = buildMovementsQueryParams({
        page: 2,
        limit: 15,
        productId: "prod_123",
        variantSku: "SKU-99",
        type: "PURCHASE",
        sortBy: "createdAt:desc",
      });

      expect(query).toContain("page=2");
      expect(query).toContain("limit=15");
      expect(query).toContain("productId=prod_123");
      expect(query).toContain("variantSku=SKU-99");
      expect(query).toContain("type=PURCHASE");
      expect(query).toContain("sortBy=createdAt%3Adesc");
    });

    it("aliases sort to sortBy for backend compatibility", () => {
      const query = buildMovementsQueryParams({
        sort: "createdAt:asc",
      });

      expect(query).toContain("sortBy=createdAt%3Aasc");
    });

    it("omits ALL from type filter", () => {
      const query = buildMovementsQueryParams({
        page: 1,
        type: "ALL",
      });

      expect(query).not.toContain("type=");
      expect(query).toBe("page=1");
    });
  });
});

describe("Inventory Validation Schema", () => {
  it("validates a correct manual adjustment payload", () => {
    const payload = {
      productId: "prod_12345",
      variantSku: "SKU-BLK-M",
      quantityChange: 15,
      type: "PURCHASE",
      reason: "Restocked from primary factory shipment",
    };

    const result = adjustStockSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("validates negative adjustments with reason", () => {
    const payload = {
      productId: "prod_12345",
      variantSku: "SKU-BLK-M",
      quantityChange: -3,
      type: "DAMAGE",
      reason: "Damaged during warehouse transit inspection",
    };

    const result = adjustStockSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity change", () => {
    const payload = {
      productId: "prod_12345",
      variantSku: "SKU-BLK-M",
      quantityChange: 0,
      type: "ADJUSTMENT",
      reason: "Annual physical count adjustment",
    };

    const result = adjustStockSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects reason shorter than 3 characters", () => {
    const payload = {
      productId: "prod_12345",
      variantSku: "SKU-BLK-M",
      quantityChange: 5,
      type: "ADJUSTMENT",
      reason: "ok",
    };

    const result = adjustStockSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects unsupported adjustment types", () => {
    const payload = {
      productId: "prod_12345",
      variantSku: "SKU-BLK-M",
      quantityChange: 5,
      type: "INVALID_TYPE",
      reason: "Test adjustment",
    };

    const result = adjustStockSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects empty productId or variantSku", () => {
    const payloadNoProd = {
      productId: "",
      variantSku: "SKU-BLK-M",
      quantityChange: 5,
      type: "ADJUSTMENT",
      reason: "Test adjustment",
    };
    expect(adjustStockSchema.safeParse(payloadNoProd).success).toBe(false);

    const payloadNoSku = {
      productId: "prod_123",
      variantSku: "",
      quantityChange: 5,
      type: "ADJUSTMENT",
      reason: "Test adjustment",
    };
    expect(adjustStockSchema.safeParse(payloadNoSku).success).toBe(false);
  });
});

describe("Inventory RBAC and Permissions", () => {
  const staffPermissions = ["inventory:read", "inventory:write", "products:read"];

  it("maps frontend inventory permissions to backend express requirements", () => {
    expect(PERMISSION_BACKEND_MAP[PERMISSIONS.INVENTORY_VIEW]).toBe("inventory:read");
    expect(PERMISSION_BACKEND_MAP[PERMISSIONS.INVENTORY_ADJUST]).toBe("inventory:write");
  });

  it("allows SUPER_ADMIN wildcard access unconditionally", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.INVENTORY_VIEW)).toBe(true);
    expect(can("SUPER_ADMIN", PERMISSIONS.INVENTORY_ADJUST)).toBe(true);
  });

  it("allows ADMIN and INVENTORY_MANAGER with granted backend permissions", () => {
    expect(can("ADMIN", PERMISSIONS.INVENTORY_VIEW, staffPermissions)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.INVENTORY_ADJUST, staffPermissions)).toBe(true);

    expect(can("INVENTORY_MANAGER", PERMISSIONS.INVENTORY_VIEW, staffPermissions)).toBe(true);
    expect(can("INVENTORY_MANAGER", PERMISSIONS.INVENTORY_ADJUST, staffPermissions)).toBe(true);
  });

  it("denies INVENTORY_MANAGER if missing backend inventory:write permission", () => {
    const readOnlyPermissions = ["inventory:read", "products:read"];
    expect(can("INVENTORY_MANAGER", PERMISSIONS.INVENTORY_VIEW, readOnlyPermissions)).toBe(true);
    expect(can("INVENTORY_MANAGER", PERMISSIONS.INVENTORY_ADJUST, readOnlyPermissions)).toBe(false);
  });

  it("forbids CUSTOMER and ACCOUNTANT even if forged permissions are present", () => {
    expect(can("CUSTOMER", PERMISSIONS.INVENTORY_VIEW, staffPermissions)).toBe(false);
    expect(can("CUSTOMER", PERMISSIONS.INVENTORY_ADJUST, staffPermissions)).toBe(false);

    expect(can("ACCOUNTANT", PERMISSIONS.INVENTORY_VIEW, staffPermissions)).toBe(false);
    expect(can("ACCOUNTANT", PERMISSIONS.INVENTORY_ADJUST, staffPermissions)).toBe(false);
  });

  it("denies unauthenticated or invalid roles", () => {
    expect(can(null, PERMISSIONS.INVENTORY_VIEW)).toBe(false);
    expect(can(undefined, PERMISSIONS.INVENTORY_ADJUST)).toBe(false);
    expect(can("HACKER_ROLE", PERMISSIONS.INVENTORY_ADJUST)).toBe(false);
  });
});
