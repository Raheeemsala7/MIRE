import { describe, expect, it } from "vitest";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeFilterSchema,
} from "./employee.schema";

describe("createEmployeeSchema", () => {
  const validEmployee = {
    name: "Layla Mahmoud",
    email: "layla@mirefashion.com",
    password: "Password123!",
    phone: "+201012345678",
    role: "ADMIN" as const,
    permissions: ["orders:read", "products:read"],
  };

  it("passes for valid employee data", () => {
    const result = createEmployeeSchema.safeParse(validEmployee);
    expect(result.success).toBe(true);
  });

  it("fails if name has less than 2 characters", () => {
    const result = createEmployeeSchema.safeParse({
      ...validEmployee,
      name: "A",
    });
    expect(result.success).toBe(false);
  });

  it("fails if email is invalid", () => {
    const result = createEmployeeSchema.safeParse({
      ...validEmployee,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("fails if password has less than 6 characters", () => {
    const result = createEmployeeSchema.safeParse({
      ...validEmployee,
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("forbids creating SUPER_ADMIN via creation schema", () => {
    const result = createEmployeeSchema.safeParse({
      ...validEmployee,
      role: "SUPER_ADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid creatable roles", () => {
    const roles = [
      "ADMIN",
      "ORDER_MANAGER",
      "CUSTOMER_SUPPORT",
      "INVENTORY_MANAGER",
      "ACCOUNTANT",
    ] as const;

    for (const role of roles) {
      const result = createEmployeeSchema.safeParse({
        ...validEmployee,
        role,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("updateEmployeeSchema", () => {
  it("allows partial updates", () => {
    const result = updateEmployeeSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("fails if updated password is too short", () => {
    const result = updateEmployeeSchema.safeParse({
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty password to be passed without error", () => {
    const result = updateEmployeeSchema.safeParse({
      password: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("employeeFilterSchema", () => {
  it("applies defaults correctly", () => {
    const result = employeeFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort).toBe("-createdAt");
    }
  });
});
