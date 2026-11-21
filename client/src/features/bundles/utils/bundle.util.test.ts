import { describe, it, expect } from "vitest";
import {
  getBundleStatus,
  getBundleStatusBadgeConfig,
  getBundleTypeLabelKey,
  buildBundleQueryParams,
  filterBundlesClientSide,
  formatBundleCurrency,
  formatBundleDate,
} from "./bundle.util";
import type { Bundle } from "../types/bundle.types";

describe("getBundleStatus", () => {
  const base = {
    isActive: true,
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-30T00:00:00.000Z",
  };

  it("returns INACTIVE when isActive is false", () => {
    const status = getBundleStatus(
      { ...base, isActive: false },
      new Date("2026-11-15T00:00:00.000Z")
    );
    expect(status).toBe("INACTIVE");
  });

  it("returns SCHEDULED when start date is in the future", () => {
    const status = getBundleStatus(
      base,
      new Date("2026-10-15T00:00:00.000Z")
    );
    expect(status).toBe("SCHEDULED");
  });

  it("returns EXPIRED when end date is in the past", () => {
    const status = getBundleStatus(
      base,
      new Date("2026-12-15T00:00:00.000Z")
    );
    expect(status).toBe("EXPIRED");
  });

  it("returns ACTIVE when current date is between start and end", () => {
    const status = getBundleStatus(
      base,
      new Date("2026-11-15T00:00:00.000Z")
    );
    expect(status).toBe("ACTIVE");
  });
});

describe("getBundleStatusBadgeConfig", () => {
  it("provides correct badge config for each status", () => {
    expect(getBundleStatusBadgeConfig("ACTIVE").variant).toBe("default");
    expect(getBundleStatusBadgeConfig("SCHEDULED").variant).toBe("secondary");
    expect(getBundleStatusBadgeConfig("EXPIRED").variant).toBe("destructive");
    expect(getBundleStatusBadgeConfig("INACTIVE").variant).toBe("outline");
  });
});

describe("getBundleTypeLabelKey", () => {
  it("returns localized keys for all bundle types", () => {
    expect(getBundleTypeLabelKey("FIXED_PRICE")).toBe("bundle-type-fixed-price");
    expect(getBundleTypeLabelKey("BUY_X_GET_Y")).toBe("bundle-type-buy-x-get-y");
    expect(getBundleTypeLabelKey("PERCENTAGE")).toBe("bundle-type-percentage");
    expect(getBundleTypeLabelKey("COLLECTION_PICK")).toBe("bundle-type-collection-pick");
  });
});

describe("buildBundleQueryParams", () => {
  it("builds query parameters correctly omitting default values", () => {
    const q1 = buildBundleQueryParams({ page: 1, limit: 20 });
    expect(q1).toBe("");

    const q2 = buildBundleQueryParams({
      page: 2,
      limit: 50,
      search: "abaya",
      type: "FIXED_PRICE",
      status: "ACTIVE",
      sortBy: "createdAt:desc",
    });
    expect(q2).toContain("page=2");
    expect(q2).toContain("limit=50");
    expect(q2).toContain("search=abaya");
    expect(q2).toContain("type=FIXED_PRICE");
    expect(q2).toContain("status=ACTIVE");
    expect(q2).toContain("activeOnly=true");
    expect(q2).toContain("sortBy=createdAt%3Adesc");
  });
});

describe("formatBundleCurrency", () => {
  it("formats positive numbers with currency", () => {
    const formatted = formatBundleCurrency(499, "en", "EGP");
    expect(formatted).toContain("499");
  });

  it("returns '-' for null or undefined", () => {
    expect(formatBundleCurrency(null)).toBe("-");
    expect(formatBundleCurrency(undefined)).toBe("-");
  });
});

describe("formatBundleDate", () => {
  it("formats valid date string", () => {
    const res = formatBundleDate("2026-11-20T12:00:00.000Z", "en");
    expect(res).toContain("2026");
  });

  it("returns '-' for empty date", () => {
    expect(formatBundleDate("")).toBe("-");
  });
});

describe("filterBundlesClientSide", () => {
  const now = new Date("2026-11-20T12:00:00.000Z");
  const past = "2026-11-01T00:00:00.000Z";
  const future = "2026-12-01T00:00:00.000Z";
  const farPast = "2026-10-01T00:00:00.000Z";
  const farFuture = "2027-01-01T00:00:00.000Z";

  const mockBundles: Bundle[] = [
    {
      _id: "b1",
      title: "Ramadan Abaya Special",
      slug: "ramadan-abaya-special",
      description: "Buy 2 elegant pieces",
      type: "FIXED_PRICE",
      eligibleProducts: [],
      eligibleCategories: [],
      requiredQuantity: 2,
      freeQuantity: 0,
      bundlePrice: 599,
      discountPercentage: null,
      startDate: past,
      endDate: future,
      usageLimit: null,
      usedCount: 0,
      maxUsesPerCustomer: 1,
      isActive: true,
      createdAt: past,
      updatedAt: past,
    },
    {
      _id: "b2",
      title: "Summer Hijab BOGO",
      slug: "summer-hijab-bogo",
      description: "Buy 2 get 1 free",
      type: "BUY_X_GET_Y",
      eligibleProducts: [],
      eligibleCategories: [],
      requiredQuantity: 2,
      freeQuantity: 1,
      bundlePrice: null,
      discountPercentage: null,
      startDate: future,
      endDate: farFuture,
      usageLimit: null,
      usedCount: 0,
      maxUsesPerCustomer: 1,
      isActive: true,
      createdAt: past,
      updatedAt: past,
    },
    {
      _id: "b3",
      title: "Autumn Accessories 25% Off",
      slug: "autumn-accessories",
      description: "Quarter discount on sets",
      type: "PERCENTAGE",
      eligibleProducts: [],
      eligibleCategories: [],
      requiredQuantity: 3,
      freeQuantity: 0,
      bundlePrice: null,
      discountPercentage: 25,
      startDate: farPast,
      endDate: past,
      usageLimit: null,
      usedCount: 0,
      maxUsesPerCustomer: 1,
      isActive: true,
      createdAt: farPast,
      updatedAt: farPast,
    },
    {
      _id: "b4",
      title: "Winter Collection Pick",
      slug: "winter-collection-pick",
      description: "Disabled seasonal promo",
      type: "COLLECTION_PICK",
      eligibleProducts: [],
      eligibleCategories: [],
      requiredQuantity: 2,
      freeQuantity: 0,
      bundlePrice: 799,
      discountPercentage: null,
      startDate: past,
      endDate: future,
      usageLimit: null,
      usedCount: 0,
      maxUsesPerCustomer: 1,
      isActive: false,
      createdAt: past,
      updatedAt: past,
    },
  ];

  it("filters accurately by search query across title, description, and slug", () => {
    const res1 = filterBundlesClientSide(mockBundles, { search: "ramadan" }, now);
    expect(res1).toHaveLength(1);
    expect(res1[0]._id).toBe("b1");

    const res2 = filterBundlesClientSide(mockBundles, { search: "discount" }, now);
    expect(res2).toHaveLength(1);
    expect(res2[0]._id).toBe("b3");

    const res3 = filterBundlesClientSide(mockBundles, { search: "winter-collection" }, now);
    expect(res3).toHaveLength(1);
    expect(res3[0]._id).toBe("b4");

    const resNone = filterBundlesClientSide(mockBundles, { search: "non-existent" }, now);
    expect(resNone).toHaveLength(0);
  });

  it("filters accurately by bundle type", () => {
    const bogo = filterBundlesClientSide(mockBundles, { type: "BUY_X_GET_Y" }, now);
    expect(bogo).toHaveLength(1);
    expect(bogo[0]._id).toBe("b2");

    const fixed = filterBundlesClientSide(mockBundles, { type: "FIXED_PRICE" }, now);
    expect(fixed).toHaveLength(1);
    expect(fixed[0]._id).toBe("b1");
  });

  it("filters accurately by dynamic status", () => {
    const active = filterBundlesClientSide(mockBundles, { status: "ACTIVE" }, now);
    expect(active).toHaveLength(1);
    expect(active[0]._id).toBe("b1");

    const scheduled = filterBundlesClientSide(mockBundles, { status: "SCHEDULED" }, now);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]._id).toBe("b2");

    const expired = filterBundlesClientSide(mockBundles, { status: "EXPIRED" }, now);
    expect(expired).toHaveLength(1);
    expect(expired[0]._id).toBe("b3");

    const inactive = filterBundlesClientSide(mockBundles, { status: "INACTIVE" }, now);
    expect(inactive).toHaveLength(1);
    expect(inactive[0]._id).toBe("b4");
  });

  it("combines multiple filters together without interference", () => {
    const combined = filterBundlesClientSide(
      mockBundles,
      { search: "abaya", type: "FIXED_PRICE", status: "ACTIVE" },
      now
    );
    expect(combined).toHaveLength(1);
    expect(combined[0]._id).toBe("b1");

    const mismatch = filterBundlesClientSide(
      mockBundles,
      { search: "abaya", type: "BUY_X_GET_Y" },
      now
    );
    expect(mismatch).toHaveLength(0);
  });
});
