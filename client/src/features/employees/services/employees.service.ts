import type {
  EmployeeFilters,
  EmployeesPaginatedResponse,
  SingleEmployeeResponse,
  CreateEmployeePayload,
  UpdateEmployeePayload,
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
    cache: "no-store",
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
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || errorBody?.error || `Failed to fetch employee details (${res.status})`);
  }

  return res.json() as Promise<SingleEmployeeResponse>;
}

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<SingleEmployeeResponse> {
  const res = await fetch("/api/admin/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || errorBody?.error || `Failed to create employee (${res.status})`);
  }

  return res.json() as Promise<SingleEmployeeResponse>;
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<SingleEmployeeResponse> {
  const res = await fetch(`/api/admin/employees/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || errorBody?.error || `Failed to update employee (${res.status})`);
  }

  return res.json() as Promise<SingleEmployeeResponse>;
}

export async function toggleEmployeeStatus(id: string): Promise<SingleEmployeeResponse> {
  const res = await fetch(`/api/admin/employees/${encodeURIComponent(id)}/toggle-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || errorBody?.error || `Failed to toggle employee status (${res.status})`);
  }

  return res.json() as Promise<SingleEmployeeResponse>;
}
