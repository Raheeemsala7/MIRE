import type {
  EmployeeFilters,
  EmployeesPaginatedResponse,
  SingleEmployeeResponse,
} from "../types/employee.types";

export async function fetchEmployees(
  filters: EmployeeFilters = {}
): Promise<EmployeesPaginatedResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search && filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.role) params.set("role", filters.role);
  if (filters.isActive !== undefined && filters.isActive !== "") {
    params.set("isActive", filters.isActive);
  }
  if (filters.sort) params.set("sort", filters.sort);

  const query = params.toString();
  const url = `/api/admin/employees${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || errorBody?.error || `Failed to fetch employees (${res.status})`);
  }

  return res.json() as Promise<EmployeesPaginatedResponse>;
}

export async function fetchEmployeeById(id: string): Promise<SingleEmployeeResponse> {
  const res = await fetch(`/api/admin/employees/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || errorBody?.error || `Failed to fetch employee details (${res.status})`);
  }

  return res.json() as Promise<SingleEmployeeResponse>;
}
