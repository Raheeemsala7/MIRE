import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import {
  createEmployeeAction,
  updateEmployeeAction,
  toggleEmployeeStatusAction,
} from "./employee.actions";

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/permissions/can", async () => {
  const actual = await vi.importActual<typeof import("@/lib/permissions/can")>("@/lib/permissions/can");
  return {
    ...actual,
    can: vi.fn(actual.can),
  };
});

vi.mock("@/lib/auth/session", () => ({
  serverApiGet: vi.fn(),
  serverApiPost: vi.fn(),
  serverApiPatch: vi.fn(),
}));

import { auth } from "@/auth";
import { can } from "@/lib/permissions/can";
import { serverApiGet, serverApiPost, serverApiPatch } from "@/lib/auth/session";

function mockSession(user: { id: string; role: string; permissions?: readonly string[] }): Session {
  return {
    user: user as unknown as Session["user"],
    expires: new Date(Date.now() + 3600000).toISOString(),
  };
}

describe("Employee Server Actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("createEmployeeAction", () => {
    it("creates employee when authorized", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "SUPER_ADMIN",
          permissions: ["*"],
        })
      );

      const mockResponse = {
        success: true,
        data: { _id: "new-emp", name: "New Staff", email: "new@mire.com", role: "ADMIN" as const },
      };
      vi.mocked(serverApiPost).mockResolvedValue(mockResponse);

      const payload = {
        name: "New Staff",
        email: "new@mire.com",
        password: "Secret123!",
        role: "ADMIN" as const,
      };

      const result = await createEmployeeAction(payload);
      expect(serverApiPost).toHaveBeenCalledWith("/employees", expect.objectContaining({ email: "new@mire.com" }));
      expect(result).toEqual(mockResponse);
    });

    it("throws when user lacks create permission", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "viewer-1",
          role: "EMPLOYEE",
          permissions: [],
        })
      );

      await expect(
        createEmployeeAction({
          name: "New Staff",
          email: "new@mire.com",
          password: "Secret123!",
          role: "ADMIN",
        })
      ).rejects.toThrow();
    });

    it("throws when payload fails schema validation", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "SUPER_ADMIN",
          permissions: ["*"],
        })
      );

      await expect(
        createEmployeeAction({
          name: "A",
          email: "not-an-email",
          password: "short",
          role: "ADMIN",
        })
      ).rejects.toThrow(/Validation error/);
    });
  });

  describe("updateEmployeeAction", () => {
    it("updates employee when user has update permission", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "super-1",
          role: "SUPER_ADMIN",
          permissions: ["*"],
        })
      );

      vi.mocked(serverApiGet).mockResolvedValue({
        success: true,
        data: { _id: "emp-1", role: "EMPLOYEE", name: "Old Name" },
      });

      const mockResponse = {
        success: true,
        data: { _id: "emp-1", name: "Updated Name" },
      };
      vi.mocked(serverApiPatch).mockResolvedValue(mockResponse);

      const result = await updateEmployeeAction("emp-1", { name: "Updated Name" });
      expect(serverApiGet).toHaveBeenCalledWith("/employees/emp-1");
      expect(serverApiPatch).toHaveBeenCalledWith("/employees/emp-1", { name: "Updated Name" });
      expect(result).toEqual(mockResponse);
    });

    it("prevents non-Super Admin from modifying a Super Admin account even for name update", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["employees:read", "employees:write"],
        })
      );

      vi.mocked(can).mockReturnValueOnce(true);

      vi.mocked(serverApiGet).mockResolvedValue({
        success: true,
        data: { _id: "super-9", role: "SUPER_ADMIN", name: "Root" },
      });

      await expect(
        updateEmployeeAction("super-9", { name: "Hacked" })
      ).rejects.toThrow("Only Super Admin can modify a Super Admin account.");
    });

    it("throws Employee not found when target employee does not exist", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "super-1",
          role: "SUPER_ADMIN",
          permissions: ["*"],
        })
      );

      const { BackendApiError } = await import("@/lib/auth/backend-client");
      vi.mocked(serverApiGet).mockRejectedValue(
        new BackendApiError(404, { message: "Employee not found" })
      );

      await expect(
        updateEmployeeAction("non-existent", { name: "Test" })
      ).rejects.toThrow("Employee not found");
    });

    it("throws when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      await expect(
        updateEmployeeAction("emp-1", { name: "Updated Name" })
      ).rejects.toThrow("Authentication required");
    });

    it("throws when missing permission to manage roles", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "EMPLOYEE",
          permissions: [],
        })
      );

      await expect(
        updateEmployeeAction("emp-1", { role: "ADMIN" })
      ).rejects.toThrow(/permission to manage employee roles/);
    });
  });

  describe("toggleEmployeeStatusAction", () => {
    it("toggles employee status when authorized", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "super-1",
          role: "SUPER_ADMIN",
          permissions: ["*"],
        })
      );

      vi.mocked(serverApiGet).mockResolvedValue({
        success: true,
        data: { _id: "emp-2", role: "ADMIN", isActive: true },
      });

      const mockResponse = {
        success: true,
        data: { _id: "emp-2", isActive: false },
      };
      vi.mocked(serverApiPatch).mockResolvedValue(mockResponse);

      const result = await toggleEmployeeStatusAction("emp-2");
      expect(serverApiPatch).toHaveBeenCalledWith("/employees/emp-2/toggle-status", {});
      expect(result).toEqual(mockResponse);
    });

    it("prevents self-lockout", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "SUPER_ADMIN",
          permissions: ["*"],
        })
      );

      vi.mocked(serverApiGet).mockResolvedValue({
        success: true,
        data: { _id: "admin-1", role: "SUPER_ADMIN", isActive: true },
      });

      await expect(toggleEmployeeStatusAction("admin-1")).rejects.toThrow();
    });
  });
});
