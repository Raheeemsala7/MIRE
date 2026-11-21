import { describe, expect, it } from "vitest";
import {
  calculateEmployeeMetrics,
  getRoleBadgeVariant,
  formatEmployeeDate,
  formatPermissionLabel,
} from "./employee.util";
import type { Employee } from "../types/employee.types";

describe("employee.util", () => {
  const sampleEmployees: Employee[] = [
    {
      _id: "1",
      name: "Super Admin",
      email: "super@mire.com",
      role: "SUPER_ADMIN",
      permissions: ["*"],
      isActive: true,
      createdAt: "2026-01-15T10:00:00.000Z",
    },
    {
      _id: "2",
      name: "Admin Staff",
      email: "admin@mire.com",
      role: "ADMIN",
      permissions: ["employees:read"],
      isActive: false,
      createdAt: "2026-02-20T10:00:00.000Z",
    },
    {
      _id: "3",
      name: "Support Staff",
      email: "support@mire.com",
      role: "CUSTOMER_SUPPORT",
      permissions: [],
      isActive: true,
      createdAt: "2026-03-05T10:00:00.000Z",
    },
  ];

  it("calculates metrics properly with total override", () => {
    const metrics = calculateEmployeeMetrics(sampleEmployees, 50);
    expect(metrics.total).toBe(50);
    expect(metrics.active).toBe(2);
    expect(metrics.inactive).toBe(1);
    expect(metrics.roleCounts.SUPER_ADMIN).toBe(1);
    expect(metrics.roleCounts.ADMIN).toBe(1);
    expect(metrics.roleCounts.CUSTOMER_SUPPORT).toBe(1);
    expect(metrics.roleCounts.ACCOUNTANT).toBe(0);
  });

  it("calculates metrics with fallback total when not supplied", () => {
    const metrics = calculateEmployeeMetrics(sampleEmployees);
    expect(metrics.total).toBe(3);
    expect(metrics.active).toBe(2);
    expect(metrics.inactive).toBe(1);
  });

  it("returns correct role badge variants", () => {
    expect(getRoleBadgeVariant("SUPER_ADMIN")).toBe("default");
    expect(getRoleBadgeVariant("ADMIN")).toBe("secondary");
    expect(getRoleBadgeVariant("CUSTOMER_SUPPORT")).toBe("outline");
    expect(getRoleBadgeVariant("ORDER_MANAGER")).toBe("outline");
  });

  it("formats dates gracefully without hydration disparity", () => {
    expect(formatEmployeeDate(undefined)).toBe("—");
    expect(formatEmployeeDate("")).toBe("—");

    const formattedEn = formatEmployeeDate("2026-01-15T10:00:00.000Z", "en");
    expect(formattedEn).toContain("2026");

    const formattedAr = formatEmployeeDate("2026-01-15T10:00:00.000Z", "ar");
    expect(formattedAr).toContain("2026");
  });

  it("formats permission labels into clean human-readable titles", () => {
    expect(formatPermissionLabel("")).toBe("");
    expect(formatPermissionLabel("*")).toBe("All Capabilities (*)");
    expect(formatPermissionLabel("orders:read")).toBe("Orders Read");
    expect(formatPermissionLabel("custom_warehouse.inspect")).toBe("Custom Warehouse Inspect");
  });
});
