import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import {
  createBundleAction,
  updateBundleAction,
  deleteBundleAction,
  toggleBundleStatusAction,
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

describe("Bundle Server Actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const validBundleInput = {
    title: "Ramadan Abaya Duo",
    description: "Two premium abayas for a special price",
    type: "FIXED_PRICE" as const,
    requiredQuantity: 2,
    freeQuantity: 0,
    bundlePrice: 1299,
    startDate: "2026-11-20T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usageLimit: 50,
    maxUsesPerCustomer: 1,
    isActive: true,
    eligibleProducts: ["673a5e8c1b2f3a001c9d4e5f"],
    eligibleCategories: [],
    bannerImage: "",
  };

  describe("createBundleAction", () => {
    it("rejects unauthorized caller without permission", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({ id: "u-1", role: "CUSTOMER_SUPPORT", permissions: ["customers:read"] })
      );

      await expect(createBundleAction(validBundleInput)).rejects.toThrow("Access denied");
      expect(serverApiPost).not.toHaveBeenCalled();
    });

    it("creates bundle successfully when user has ADMIN role and bundles:write", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({ id: "admin-1", role: "ADMIN", permissions: ["bundles:write", "bundles:read"] })
      );
      vi.mocked(serverApiPost).mockResolvedValue({
        success: true,
        statusCode: 201,
        message: "Bundle created successfully",
        data: { _id: "bundle-1", ...validBundleInput },
      });

      const result = await createBundleAction(validBundleInput);
      expect(result.data._id).toBe("bundle-1");
      expect(serverApiPost).toHaveBeenCalledWith("/bundles", expect.objectContaining({
        title: "Ramadan Abaya Duo",
        bundlePrice: 1299,
      }));
    });
  });

  describe("updateBundleAction", () => {
    it("updates bundle successfully", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({ id: "super-1", role: "SUPER_ADMIN" })
      );
      vi.mocked(serverApiPatch).mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "Bundle updated successfully",
        data: { _id: "bundle-1", title: "Updated Title" },
      });

      const result = await updateBundleAction("bundle-1", { title: "Updated Title" });
      expect(result.data.title).toBe("Updated Title");
      expect(serverApiPatch).toHaveBeenCalledWith("/bundles/bundle-1", { title: "Updated Title" });
    });
  });

  describe("deleteBundleAction", () => {
    it("deletes bundle when authorized", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({ id: "admin-1", role: "ADMIN", permissions: ["bundles:write"] })
      );
      vi.mocked(serverApiDelete).mockResolvedValue({
        success: true,
        message: "Bundle deleted successfully",
      });

      const result = await deleteBundleAction("bundle-1");
      expect(result.success).toBe(true);
      expect(serverApiDelete).toHaveBeenCalledWith("/bundles/bundle-1");
    });
  });

  describe("toggleBundleStatusAction", () => {
    it("toggles bundle status to false", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({ id: "admin-1", role: "ADMIN", permissions: ["bundles:write"] })
      );
      vi.mocked(serverApiPatch).mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "Status updated",
        data: { _id: "bundle-1", isActive: false },
      });

      const result = await toggleBundleStatusAction("bundle-1", false);
      expect(result.data.isActive).toBe(false);
      expect(serverApiPatch).toHaveBeenCalledWith("/bundles/bundle-1", { isActive: false });
    });
  });
});
