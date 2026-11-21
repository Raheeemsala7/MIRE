import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAdminBundles } from "./bundles.service";

describe("Bundles Client Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches bundles successfully from /api/admin/bundles", async () => {
    const mockData = {
      success: true,
      statusCode: 200,
      message: "Fetched successfully",
      data: [{ _id: "b1", title: "Test Bundle" }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const res = await fetchAdminBundles({ page: 1, search: "abaya" });
    expect(res).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/bundles?search=abaya",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("throws error when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: "Permission denied" }),
    });

    await expect(fetchAdminBundles()).rejects.toThrow("Permission denied");
  });
});
