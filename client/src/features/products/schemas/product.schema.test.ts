import { describe, it, expect } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  productVariantSchema,
} from "./product.schema";

describe("product.schema", () => {
  const validVariant = {
    sku: "MIRE-DRS-001-RQ-S",
    color: "Rose Quartz",
    size: "S" as const,
    stockQuantity: 10,
    priceOverride: null,
  };

  const validProduct = {
    name: "Rose Satin Maxi Dress",
    sku: "MIRE-DRS-001",
    description: "Elegant double-lined satin maxi dress with bishop sleeves.",
    category: "6afb62e43f8844e4d2513556",
    brand: "MIRE",
    price: 1450,
    discountPrice: 1250,
    images: [
      {
        url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae",
        isPrimary: true,
      },
    ],
    colors: [
      {
        name: "Rose Quartz",
        code: "#f43f5e",
      },
    ],
    sizes: ["S", "M", "L"] as const,
    variants: [validVariant],
    lowStockThreshold: 5,
    status: "ACTIVE" as const,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    tags: ["Dress", "Satin"],
  };

  it("validates a compliant product creation payload", () => {
    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sku).toBe("MIRE-DRS-001");
    }
  });

  it("validates uppercase SKU correctly", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      sku: "MIRE-TOP-001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sku).toBe("MIRE-TOP-001");
    }
  });

  it("fails when name is shorter than 2 characters", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      name: "A",
    });
    expect(result.success).toBe(false);
  });

  it("fails when description is shorter than 10 characters", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("fails when price is non-positive", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      price: -50,
    });
    expect(result.success).toBe(false);
  });

  it("fails when images array is empty", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      images: [],
    });
    expect(result.success).toBe(false);
  });

  it("fails when image URL is invalid", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      images: [{ url: "not-a-url" }],
    });
    expect(result.success).toBe(false);
  });

  it("fails when variants array is empty", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      variants: [],
    });
    expect(result.success).toBe(false);
  });

  it("validates variant schema", () => {
    const valid = productVariantSchema.safeParse({
      sku: "VAR-001",
      color: "Blue",
      size: "M",
      stockQuantity: 5,
    });
    expect(valid.success).toBe(true);

    const negativeStock = productVariantSchema.safeParse({
      sku: "VAR-001",
      color: "Blue",
      size: "M",
      stockQuantity: -1,
    });
    expect(negativeStock.success).toBe(false);
  });

  it("fails when image size exceeds 2MB", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      images: [
        {
          url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae",
          size: 3 * 1024 * 1024, // 3MB > 2MB
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("passes when image size is within 2MB limit", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      images: [
        {
          url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae",
          size: 1.5 * 1024 * 1024, // 1.5MB <= 2MB
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("fails when base64 data URI image exceeds 2MB", () => {
    // 3MB of base64 data
    const largeBase64 = "data:image/png;base64," + "A".repeat(4 * 1024 * 1024);
    const result = createProductSchema.safeParse({
      ...validProduct,
      images: [{ url: largeBase64 }],
    });
    expect(result.success).toBe(false);
  });

  it("fails when image count exceeds maximum allowed images", () => {
    const nineImages = Array.from({ length: 9 }, (_, i) => ({
      url: `https://images.unsplash.com/photo-${i}`,
    }));
    const result = createProductSchema.safeParse({
      ...validProduct,
      images: nineImages,
    });
    expect(result.success).toBe(false);
  });

  it("allows partial updates in updateProductSchema", () => {
    const partialUpdate = {
      price: 1590,
      status: "DRAFT" as const,
    };
    const result = updateProductSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });
});
