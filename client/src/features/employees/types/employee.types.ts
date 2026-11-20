import type {
  SupportedEmployeeRole,
  CreatableEmployeeRole,
} from "@/config/rbac.config";

export interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: SupportedEmployeeRole;
  permissions: string[];
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface EmployeesPaginatedResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Employee[];
  meta: PaginationMeta;
}

export interface SingleEmployeeResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Employee;
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string; // "true" | "false" | ""
  sort?: string;
}

export interface EmployeeMetricsData {
  total: number;
  active: number;
  inactive: number;
  roleCounts: Record<SupportedEmployeeRole, number>;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: CreatableEmployeeRole;
  permissions?: string[];
}

export interface UpdateEmployeePayload {
  name?: string;
  phone?: string;
  role?: SupportedEmployeeRole;
  permissions?: string[];
  isActive?: boolean;
  password?: string;
}
