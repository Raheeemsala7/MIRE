import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminBundles,
  getAdminBundleById,
  getAdminBundleOverviewStats,
} from "./queries";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => ({
  serverApiGet: vi.fn(),
}));

vi.mock("@/lib/auth/backend-client", () => ({
  apiUrl: vi.fn(() => "http://localhost:5000/api/v1"),
  BackendApiError: class BackendApiError extends Error {
    constructor(public status: number, public data?: unknown) {
      super("Backend API Error");
    }
  },
}));

import { serverApiGet } from "@/lib/auth/session";

describe("Bundle Server Queries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getAdminBundles", () => {
    it("calls serverApiGet with properly formatted query params", async () => {
      vi.mocked(serverApiGet).mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "Fetched successfully",
        data: [],
        meta: { page: 2, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: true },
      });

      await getAdminBundles({ page: 2, limit: 10, type: "FIXED_PRICE" });

      expect(serverApiGet).toHaveBeenCalledWith(
        "/bundles?page=2&limit=10&type=FIXED_PRICE"
      );
    });
  });

  describe("getAdminBundleById", () => {
    it("fetches single bundle with encoded ID", async () => {
      vi.mocked(serverApiGet).mockResolvedValue({
        success: true,
        statusCode: 200,
        message: "Fetched successfully",
        data: { _id: "bundle-123", title: "Test Bundle" },
      });

      await getAdminBundleById("bundle-123");
      expect(serverApiGet).toHaveBeenCalledWith("/bundles/bundle-123");
    });
  });

  describe("getAdminBundleOverviewStats", () => {
    it("aggregates active, scheduled, expired, and inactive bundles correctly using activeOnly backend endpoint", async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000 * 5).toISOString();
      const future = new Date(now.getTime() + 86400000 * 5).toISOString();
      const farPast = new Date(now.getTime() - 86400000 * 10).toISOString();
      const farFuture = new Date(now.getTime() + 86400000 * 10).toISOString();

      vi.mocked(serverApiGet).mockImplementation(async <T>(path: string): Promise<T> => {
        if (path === "/bundles?limit=1&activeOnly=true") {
          return {
            success: true,
            statusCode: 200,
            message: "Active count",
            data: [],
            meta: { page: 1, limit: 1, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          } as unknown as T;
        }

        return {
          success: true,
          statusCode: 200,
          message: "Success",
          data: [
            // Active
            { _id: "b1", isActive: true, startDate: past, endDate: future },
            // Scheduled
            { _id: "b2", isActive: true, startDate: future, endDate: farFuture },
            // Expired
            { _id: "b3", isActive: true, startDate: farPast, endDate: past },
            // Inactive
            { _id: "b4", isActive: false, startDate: past, endDate: future },
          ],
          meta: { page: 1, limit: 100, total: 4, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        } as unknown as T;
      });

      const stats = await getAdminBundleOverviewStats();

      expect(stats.totalBundles).toBe(4);
      expect(stats.activeBundles).toBe(1);
      expect(stats.scheduledBundles).toBe(1);
      expect(stats.expiredBundles).toBe(1);
      expect(stats.inactiveBundles).toBe(1);
      expect(serverApiGet).toHaveBeenCalledWith("/bundles?limit=1&activeOnly=true");
    });

    it("does not truncate global active count from backend when total exceeds 100", async () => {
      vi.mocked(serverApiGet).mockImplementation(async <T>(path: string): Promise<T> => {
        if (path === "/bundles?limit=1&activeOnly=true") {
          return {
            success: true,
            statusCode: 200,
            message: "Active count",
            data: [],
            meta: { page: 1, limit: 1, total: 85, totalPages: 85, hasNextPage: true, hasPrevPage: false },
          } as unknown as T;
        }

        return {
          success: true,
          statusCode: 200,
          message: "Page of 100",
          data: Array(100).fill({ _id: "bx", isActive: true, startDate: "2026-01-01", endDate: "2026-12-31" }),
          meta: { page: 1, limit: 100, total: 150, totalPages: 2, hasNextPage: true, hasPrevPage: false },
        } as unknown as T;
      });

      const stats = await getAdminBundleOverviewStats();

      expect(stats.totalBundles).toBe(150);
      expect(stats.activeBundles).toBe(85);
      expect(stats.inactiveBundles).toBe(65);
    });
  });
});
