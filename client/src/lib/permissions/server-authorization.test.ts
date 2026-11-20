import { describe, expect, it, vi } from "vitest";
import {
  assertSessionPermission,
  validateEmployeeMutation,
} from "./server-authorization";
import { PERMISSIONS } from "@/config/rbac.config";
import type { Session } from "next-auth";
import type { SafeUser } from "@/lib/auth/types";

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe("assertSessionPermission", () => {
  it("rejects with 401 when session is null", () => {
    const result = assertSessionPermission(null, PERMISSIONS.EMPLOYEES_VIEW);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("rejects with 403 when session user lacks required permission", () => {
    const session: Session = {
      expires: "2026-12-01T00:00:00Z",
      user: {
        id: "emp-1",
        name: "Order Staff",
        email: "staff@mire.com",
        role: "ORDER_MANAGER",
      },
    };
    const result = assertSessionPermission(
      session,
      PERMISSIONS.EMPLOYEES_VIEW
    );
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
  });

  it("authorizes when user has required permission", () => {
    const session: Session = {
      expires: "2026-12-01T00:00:00Z",
      user: {
        id: "admin-1",
        name: "Admin User",
        email: "admin@mire.com",
        role: "ADMIN",
        permissions: ["employees:read"],
      },
    };
    const result = assertSessionPermission(
      session,
      PERMISSIONS.EMPLOYEES_VIEW
    );
    expect(result.authorized).toBe(true);
    expect(result.status).toBe(200);
  });
});

describe("validateEmployeeMutation security constraints", () => {
  const superAdminUser: SafeUser = {
    id: "super-1",
    name: "Super Admin",
    email: "super@mire.com",
    role: "SUPER_ADMIN",
  };

  const adminUser: SafeUser = {
    id: "admin-1",
    name: "Delegated Admin",
    email: "admin@mire.com",
    role: "ADMIN",
    permissions: ["dashboard:read", "employees:read"],
  };

  it("prevents self-deactivation", () => {
    const result = validateEmployeeMutation({
      actingUser: superAdminUser,
      targetUserId: "super-1",
      isStatusToggle: true,
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.message).toContain("Self-deactivation is prohibited");
  });

  it("prevents deactivating a Super Admin account", () => {
    const result = validateEmployeeMutation({
      actingUser: superAdminUser,
      targetUserId: "super-2",
      targetUserRole: "SUPER_ADMIN",
      isStatusToggle: true,
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.message).toContain("Super Admin accounts cannot be deactivated");
  });

  it("prevents non-Super Admin from modifying a Super Admin account", () => {
    const result = validateEmployeeMutation({
      actingUser: adminUser,
      targetUserId: "super-1",
      targetUserRole: "SUPER_ADMIN",
      newRole: "ADMIN",
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.message).toContain("Only Super Admin can modify a Super Admin account");
  });

  it("prevents non-Super Admin from promoting someone to Super Admin", () => {
    const result = validateEmployeeMutation({
      actingUser: adminUser,
      targetUserId: "staff-1",
      targetUserRole: "ORDER_MANAGER",
      newRole: "SUPER_ADMIN",
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  it("prevents a user from altering their own role", () => {
    const result = validateEmployeeMutation({
      actingUser: superAdminUser,
      targetUserId: "super-1",
      targetUserRole: "SUPER_ADMIN",
      newRole: "ADMIN",
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.message).toContain("cannot change your own role");
  });

  it("allows valid Super Admin operations", () => {
    const result = validateEmployeeMutation({
      actingUser: superAdminUser,
      targetUserId: "staff-2",
      targetUserRole: "CUSTOMER_SUPPORT",
      newRole: "ORDER_MANAGER",
      newPermissions: ["orders:read", "orders:write"],
    });
    expect(result.valid).toBe(true);
  });

  it("allows delegated Admin to specify role during employee creation without manage_roles", () => {
    const result = validateEmployeeMutation({
      actingUser: adminUser,
      newRole: "CUSTOMER_SUPPORT",
    });
    expect(result.valid).toBe(true);
  });

  it("prevents delegated Admin without manage_roles from altering existing employee role", () => {
    const result = validateEmployeeMutation({
      actingUser: adminUser,
      targetUserId: "staff-2",
      targetUserRole: "CUSTOMER_SUPPORT",
      newRole: "ORDER_MANAGER",
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.message).toContain("permission to manage employee roles");
  });

  it("prevents delegated Admin without manage_roles from stripping permissions to empty array", () => {
    const result = validateEmployeeMutation({
      actingUser: adminUser,
      targetUserId: "staff-2",
      targetUserRole: "CUSTOMER_SUPPORT",
      newPermissions: [],
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.message).toContain("permission to manage employee permissions");
  });

  it("prevents delegated Admin from creating employee as SUPER_ADMIN", () => {
    const result = validateEmployeeMutation({
      actingUser: adminUser,
      newRole: "SUPER_ADMIN",
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.message).toContain("Only a Super Admin can promote or create an account as Super Admin");
  });

  it("prevents delegated Admin from assigning permissions beyond their authority", () => {
    const result = validateEmployeeMutation({
      actingUser: adminUser,
      newRole: "CUSTOMER_SUPPORT",
      newPermissions: ["settings:write"], // adminUser does not hold settings:write
    });
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.message).toContain("cannot grant permissions that you do not hold yourself");
  });
});
