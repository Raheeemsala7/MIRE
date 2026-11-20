import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchEmployees,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
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

  it("createEmployee sends POST request with payload", async () => {
    const mockResponse = {
      success: true,
      statusCode: 201,
      data: { _id: "new-1", name: "New Staff" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const payload = {
      name: "New Staff",
      email: "new@mire.com",
      password: "Secret123!",
      role: "ADMIN" as const,
    };

    const result = await createEmployee(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/employees",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("updateEmployee sends PATCH request with payload", async () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: { _id: "emp-1", name: "Updated Staff" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const payload = { name: "Updated Staff" };
    const result = await updateEmployee("emp-1", payload);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/employees/emp-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("toggleEmployeeStatus sends PATCH request to toggle endpoint", async () => {
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: { _id: "emp-1", isActive: false },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await toggleEmployeeStatus("emp-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/employees/emp-1/toggle-status",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(result).toEqual(mockResponse);
  });

  it("throws error with backend message when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "An account with this email already exists" }),
    });

    await expect(
      createEmployee({
        name: "Dup",
        email: "dup@mire.com",
        password: "Secret123!",
        role: "ADMIN",
      })
    ).rejects.toThrow("An account with this email already exists");
  });
});
