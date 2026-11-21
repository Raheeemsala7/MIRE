import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import { updateCustomerAction } from "./customer.actions";

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  serverApiPatch: vi.fn(),
}));

import { auth } from "@/auth";
import { serverApiPatch } from "@/lib/auth/session";

function mockSession(user: { id: string; role: string; permissions?: readonly string[] }): Session {
  return {
    user: user as unknown as Session["user"],
    expires: new Date(Date.now() + 3600000).toISOString(),
  };
}

describe("Customer Server Actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("updates customer when user has CUSTOMERS_UPDATE permission", async () => {
    vi.mocked(auth).mockResolvedValue(
      mockSession({
        id: "admin-1",
        role: "ADMIN",
        permissions: ["customers:write"],
      })
    );

    const mockResponse = {
      success: true,
      data: { _id: "cust-1", fullName: "Nour Updated", tags: ["VIP"] },
    };
    vi.mocked(serverApiPatch).mockResolvedValue(mockResponse);

    const result = await updateCustomerAction("cust-1", {
      fullName: "Nour Updated",
      tags: ["VIP"],
    });

    expect(serverApiPatch).toHaveBeenCalledWith("/customers/cust-1", {
      fullName: "Nour Updated",
      tags: ["VIP"],
    });
    expect(result).toEqual(mockResponse);
  });

  it("throws when user lacks update permission", async () => {
    vi.mocked(auth).mockResolvedValue(
      mockSession({
        id: "staff-1",
        role: "EMPLOYEE",
        permissions: [],
      })
    );

    await expect(
      updateCustomerAction("cust-1", { fullName: "Nour Updated" })
    ).rejects.toThrow();
  });

  it("throws when payload fails schema validation", async () => {
    vi.mocked(auth).mockResolvedValue(
      mockSession({
        id: "admin-1",
        role: "ADMIN",
        permissions: ["customers:write"],
      })
    );

    await expect(
      updateCustomerAction("cust-1", { fullName: "A" })
    ).rejects.toThrow(/Validation error/);
  });
});
