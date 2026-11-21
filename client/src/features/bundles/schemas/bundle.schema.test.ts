import { describe, it, expect } from "vitest";
import { createBundleSchema, updateBundleSchema } from "./bundle.schema";

describe("createBundleSchema", () => {
  const validBase = {
    title: "Summer Hijab Bundle",
    description: "Special seasonal promotion",
    type: "FIXED_PRICE" as const,
    requiredQuantity: 2,
    freeQuantity: 0,
    bundlePrice: 499,
    startDate: "2026-11-20T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usageLimit: 100,
    maxUsesPerCustomer: 2,
    isActive: true,
    eligibleProducts: ["673a5e8c1b2f3a001c9d4e5f"],
    eligibleCategories: [],
  };

  it("validates a complete valid FIXED_PRICE bundle", () => {
    const result = createBundleSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Summer Hijab Bundle");
      expect(result.data.bundlePrice).toBe(499);
      expect(result.data.requiredQuantity).toBe(2);
    }
  });

  it("validates a BUY_X_GET_Y bundle with positive freeQuantity", () => {
    const bogo = {
      ...validBase,
      type: "BUY_X_GET_Y" as const,
      requiredQuantity: 2,
      freeQuantity: 1,
      bundlePrice: null,
    };
    const result = createBundleSchema.safeParse(bogo);
    expect(result.success).toBe(true);
  });

  it("rejects BUY_X_GET_Y if freeQuantity is 0 or missing", () => {
    const bogo = {
      ...validBase,
      type: "BUY_X_GET_Y" as const,
      requiredQuantity: 2,
      freeQuantity: 0,
      bundlePrice: null,
    };
    const result = createBundleSchema.safeParse(bogo);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("freeQuantity"))).toBe(true);
    }
  });

  it("validates a PERCENTAGE bundle with valid discountPercentage", () => {
    const percentage = {
      ...validBase,
      type: "PERCENTAGE" as const,
      requiredQuantity: 3,
      discountPercentage: 25,
      bundlePrice: null,
    };
    const result = createBundleSchema.safeParse(percentage);
    expect(result.success).toBe(true);
  });

  it("rejects PERCENTAGE bundle if discountPercentage is missing, 0, or over 100", () => {
    const zeroPercent = {
      ...validBase,
      type: "PERCENTAGE" as const,
      discountPercentage: 0,
      bundlePrice: null,
    };
    expect(createBundleSchema.safeParse(zeroPercent).success).toBe(false);

    const over100 = {
      ...validBase,
      type: "PERCENTAGE" as const,
      discountPercentage: 120,
      bundlePrice: null,
    };
    expect(createBundleSchema.safeParse(over100).success).toBe(false);
  });

  it("rejects FIXED_PRICE bundle if bundlePrice is missing or null", () => {
    const invalidFixed = {
      ...validBase,
      type: "FIXED_PRICE" as const,
      bundlePrice: null,
    };
    const result = createBundleSchema.safeParse(invalidFixed);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("bundlePrice"))).toBe(true);
    }
  });

  it("rejects title shorter than 2 characters", () => {
    const shortTitle = { ...validBase, title: "A" };
    const result = createBundleSchema.safeParse(shortTitle);
    expect(result.success).toBe(false);
  });

  it("rejects invalid date order where endDate is before startDate", () => {
    const invalidDates = {
      ...validBase,
      startDate: "2026-12-31T00:00:00.000Z",
      endDate: "2026-11-01T00:00:00.000Z",
    };
    const result = createBundleSchema.safeParse(invalidDates);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("endDate"))).toBe(true);
    }
  });

  it("rejects negative requiredQuantity", () => {
    const negativeQty = { ...validBase, requiredQuantity: -1 };
    expect(createBundleSchema.safeParse(negativeQty).success).toBe(false);
  });
});

describe("updateBundleSchema", () => {
  it("allows partial updates", () => {
    const partial = { title: "Updated Title Only" };
    const result = updateBundleSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it("rejects endDate before startDate in partial updates when both are supplied", () => {
    const badDates = {
      startDate: "2026-12-31T00:00:00.000Z",
      endDate: "2026-11-01T00:00:00.000Z",
    };
    const result = updateBundleSchema.safeParse(badDates);
    expect(result.success).toBe(false);
  });
});
