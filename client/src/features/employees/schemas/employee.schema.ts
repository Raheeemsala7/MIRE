import { z } from "zod";
import {
  CREATABLE_EMPLOYEE_ROLES,
  SUPPORTED_EMPLOYEE_ROLES,
} from "@/config/rbac.config";

export const createEmployeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name cannot exceed 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address" })
    .toLowerCase(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().trim().optional(),
  role: z.enum(CREATABLE_EMPLOYEE_ROLES, {
    message: "Please select a valid staff role",
  }),
  permissions: z.array(z.string()).optional(),
});

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name cannot exceed 100 characters" })
    .optional(),
  phone: z.string().trim().optional(),
  role: z.enum(SUPPORTED_EMPLOYEE_ROLES).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters if provided",
    }),
});

export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>;

export const employeeFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.enum(["true", "false", ""]).optional(),
  sort: z.string().optional().default("-createdAt"),
});

export type EmployeeFilterValues = z.infer<typeof employeeFilterSchema>;
