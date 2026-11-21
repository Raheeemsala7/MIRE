import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchEmployees,
  fetchEmployeeById,
} from "./employees.service";

describe("Employees client service", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchEmployees builds query string and returns data", async () => {
    const mockData = {
      success: true,
      statusCode: 200,
      data: [{ _id: "1", name: "Layla", role: "ADMIN" }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchEmployees({
      page: 1,
      limit: 10,
      search: "Layla",
      role: "ADMIN",
      isActive: "true",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/employees?page=1&limit=10&search=Layla&role=ADMIN&isActive=true",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("fetchEmployees handles empty/default filters without query params", async () => {
    const mockData = {
      success: true,
      statusCode: 200,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchEmployees();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/employees",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("fetchEmployees trims whitespace from search queries", async () => {
    const mockData = {
      success: true,
      statusCode: 200,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await fetchEmployees({ search: "   layla   " });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/employees?search=layla",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("fetchEmployees builds query with custom limit and page for pagination", async () => {
    const mockData = {
      success: true,
      statusCode: 200,
      data: [{ _id: "1", name: "Layla", role: "ADMIN" }],
      meta: { page: 2, limit: 5, total: 12, totalPages: 3 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchEmployees({ page: 2, limit: 5 });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/employees?page=2&limit=5",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("fetchEmployeeById requests specific employee by ID", async () => {
    const mockEmployee = {
      success: true,
      statusCode: 200,
      data: { _id: "emp-123", name: "Salma" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEmployee,
    });

    const result = await fetchEmployeeById("emp-123");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/employees/emp-123",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockEmployee);
  });

  it("fetchEmployeeById throws error with backend message when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Employee not found" }),
    });

    await expect(fetchEmployeeById("invalid-id")).rejects.toThrow("Employee not found");
  });
});
