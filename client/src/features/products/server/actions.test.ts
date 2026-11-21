import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import {
  createProductAction,
  updateProductAction,
  archiveProductAction,
} from "./actions";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  serverApiGet: vi.fn(),
  serverApiPost: vi.fn(),
  serverApiPatch: vi.fn(),
  serverApiDelete: vi.fn(),
}));

import { auth } from "@/auth";
import { serverApiPost, serverApiPatch, serverApiDelete } from "@/lib/auth/session";

function mockSession(user: { id: string; role: string; permissions?: readonly string[] }): Session {
  return {
    user: user as unknown as Session["user"],
    expires: new Date(Date.now() + 3600000).toISOString(),
  };
}

describe("Product Server Actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const validProductInput = {
    name: "Classic Silk Scarf",
    sku: "MIRE-ACC-001",
    description: "Pure mulberry silk scarf with hand-rolled edges.",
    category: "6afb62e43f8844e4d251355c",
    brand: "MIRE",
    price: 650,
    discountPrice: null,
    images: [{ url: "https://example.com/scarf.jpg", isPrimary: true }],
    colors: [{ name: "Ivory", code: "#fffff0" }],
    sizes: ["S" as const],
    variants: [
      {
        sku: "MIRE-ACC-001-IVO-S",
        color: "Ivory",
        size: "S" as const,
        stockQuantity: 25,
      },
    ],
    lowStockThreshold: 5,
    status: "ACTIVE" as const,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    tags: ["Silk", "Accessories"],
  };

  describe("createProductAction", () => {
    it("creates product successfully when user has permission", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["products:write"],
        })
      );

      vi.mocked(serverApiPost).mockResolvedValue({
        success: true,
        statusCode: 201,
        message: "Product created successfully",
        data: { _id: "prod-1", slug: "classic-silk-scarf" },
      });

      const res = await createProductAction(validProductInput);
      expect(res.success).toBe(true);
      expect(serverApiPost).toHaveBeenCalledWith("/products", expect.objectContaining({
        sku: "MIRE-ACC-001",
        images: [{ url: "https://example.com/scarf.jpg", isPrimary: true }],
      }));
    });

    it("strips client-side image size metadata before sending to backend", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["products:write"],
        })
      );

      vi.mocked(serverApiPost).mockResolvedValue({
        success: true,
        statusCode: 201,
        message: "Product created successfully",
        data: { _id: "prod-1", slug: "classic-silk-scarf" },
      });

      await createProductAction({
        ...validProductInput,
        images: [
          {
            url: "https://example.com/scarf.jpg",
            isPrimary: true,
            size: 1024 * 500,
          },
        ],
      });

      expect(serverApiPost).toHaveBeenCalledWith("/products", expect.objectContaining({
        images: [{ url: "https://example.com/scarf.jpg", isPrimary: true }],
      }));
    });

    it("throws descriptive error when backend responds with BackendApiError (e.g. duplicate SKU)", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["products:write"],
        })
      );

      const { BackendApiError } = await import("@/lib/auth/backend-client");
      vi.mocked(serverApiPost).mockRejectedValue(
        new BackendApiError(409, { message: "Duplicate value for sku. Please use another value." })
      );

      await expect(createProductAction(validProductInput)).rejects.toThrow(
        "Duplicate value for sku. Please use another value."
      );
    });

    it("throws unauthorized error if user lacks products.create permission", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "support-1",
          role: "CUSTOMER_SUPPORT",
          permissions: ["orders:read"],
        })
      );

      await expect(createProductAction(validProductInput)).rejects.toThrow();
      expect(serverApiPost).not.toHaveBeenCalled();
    });
  });

  describe("updateProductAction", () => {
    it("updates product when user is authorized", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["products:write"],
        })
      );

      vi.mocked(serverApiPatch).mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "Product updated successfully",
        data: { _id: "prod-1", price: 700 },
      });

      const res = await updateProductAction("prod-1", { price: 700 });
      expect(res.success).toBe(true);
      expect(serverApiPatch).toHaveBeenCalledWith("/products/prod-1", expect.objectContaining({ price: 700 }));
    });

    it("strips client-side image size metadata when updating images", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["products:write"],
        })
      );

      vi.mocked(serverApiPatch).mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "Product updated successfully",
        data: { _id: "prod-1", images: [{ url: "https://example.com/scarf2.jpg" }] },
      });

      await updateProductAction("prod-1", {
        images: [{ url: "https://example.com/scarf2.jpg", isPrimary: true, size: 2048 }],
      });

      expect(serverApiPatch).toHaveBeenCalledWith(
        "/products/prod-1",
        expect.objectContaining({
          images: [{ url: "https://example.com/scarf2.jpg", isPrimary: true }],
        })
      );
    });

    it("throws descriptive error when update returns BackendApiError", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["products:write"],
        })
      );

      const { BackendApiError } = await import("@/lib/auth/backend-client");
      vi.mocked(serverApiPatch).mockRejectedValue(
        new BackendApiError(404, { message: "Product not found" })
      );

      await expect(updateProductAction("non-existent", { price: 500 })).rejects.toThrow(
        "Product not found"
      );
    });

    it("throws error when product ID is missing", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["products:write"],
        })
      );

      await expect(updateProductAction("", { price: 700 })).rejects.toThrow("Product ID is required");
    });
  });

  describe("archiveProductAction", () => {
    it("archives product via DELETE endpoint", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["products:write"],
        })
      );

      vi.mocked(serverApiDelete).mockResolvedValue({
        success: true,
        message: "Product archived successfully",
      });

      const res = await archiveProductAction("prod-1");
      expect(res.success).toBe(true);
      expect(serverApiDelete).toHaveBeenCalledWith("/products/prod-1");
    });

    it("throws error if user lacks archive permission", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "user-1",
          role: "CUSTOMER",
          permissions: [],
        })
      );

      await expect(archiveProductAction("prod-1")).rejects.toThrow();
      expect(serverApiDelete).not.toHaveBeenCalled();
    });
  });
});
