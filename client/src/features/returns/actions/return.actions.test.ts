import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import {
  submitReturnRequestAction,
  updateReturnStatusAction,
  inspectReturnAction,
  logCallAttemptAction,
  assignReturnAction,
} from "./return.actions";
import {
  RETURN_STATUSES,
  RETURN_REASONS,
  ITEM_CONDITIONS,
  CALL_ATTEMPT_RESULTS,
  REFUND_METHODS,
} from "../types/return.types";

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  serverApiPost: vi.fn(),
  serverApiPatch: vi.fn(),
}));

import { auth } from "@/auth";
import { serverApiPost, serverApiPatch } from "@/lib/auth/session";

function mockSession(user: { id: string; role: string; permissions?: readonly string[] }): Session {
  return {
    user: user as unknown as Session["user"],
    expires: new Date(Date.now() + 3600000).toISOString(),
  };
}

describe("Return Server Actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("submitReturnRequestAction", () => {
    it("submits return request when customer is authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({ id: "cust-1", role: "CUSTOMER" })
      );

      const mockResponse = {
        success: true,
        data: { _id: "ret-1", returnNumber: "RET-2026-0001" },
      };
      vi.mocked(serverApiPost).mockResolvedValue(mockResponse);

      const payload = {
        originalOrderId: "ord-12345",
        items: [
          {
            productId: "prod-1",
            sku: "SKU-RED-M",
            color: "Red",
            size: "M",
            quantity: 1,
            unitPrice: 100,
          },
        ],
        reason: RETURN_REASONS.SIZE_TOO_SMALL,
        refundMethod: REFUND_METHODS.CASH,
      };

      const result = await submitReturnRequestAction(payload);
      expect(serverApiPost).toHaveBeenCalledWith("/returns/request", payload);
      expect(result).toEqual(mockResponse);
    });

    it("throws when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      await expect(
        submitReturnRequestAction({
          originalOrderId: "ord-1",
          items: [],
          reason: RETURN_REASONS.OTHER,
          refundMethod: REFUND_METHODS.CASH,
        })
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("updateReturnStatusAction", () => {
    it("updates return status when authorized", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["returns:write"],
        })
      );

      const mockResponse = {
        success: true,
        data: { _id: "ret-1", status: RETURN_STATUSES.RETURN_APPROVED },
      };
      vi.mocked(serverApiPatch).mockResolvedValue(mockResponse);

      const result = await updateReturnStatusAction("ret-1", {
        status: RETURN_STATUSES.RETURN_APPROVED,
        notes: "Approved by manager",
      });

      expect(serverApiPatch).toHaveBeenCalledWith("/returns/ret-1/status", {
        status: RETURN_STATUSES.RETURN_APPROVED,
        notes: "Approved by manager",
      });
      expect(result).toEqual(mockResponse);
    });

    it("throws when user lacks RETURNS_UPDATE_STATUS permission", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({ id: "staff-1", role: "EMPLOYEE", permissions: [] })
      );

      await expect(
        updateReturnStatusAction("ret-1", {
          status: RETURN_STATUSES.RETURN_APPROVED,
        })
      ).rejects.toThrow();
    });
  });

  describe("inspectReturnAction", () => {
    it("records inspection when authorized", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["returns:write"],
        })
      );

      const mockResponse = {
        success: true,
        data: { _id: "ret-1", status: RETURN_STATUSES.INSPECTED },
      };
      vi.mocked(serverApiPost).mockResolvedValue(mockResponse);

      const payload = {
        inspectionNotes: "Items in original packaging and pristine condition",
        itemInspections: [
          {
            itemId: "item-1",
            condition: ITEM_CONDITIONS.TAGS_ATTACHED,
            restockApproved: true,
          },
        ],
      };

      const result = await inspectReturnAction("ret-1", payload);
      expect(serverApiPost).toHaveBeenCalledWith("/returns/ret-1/inspect", payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("logCallAttemptAction", () => {
    it("logs call attempt when authorized", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["returns:write"],
        })
      );

      const mockResponse = {
        success: true,
        data: { _id: "ret-1" },
      };
      vi.mocked(serverApiPost).mockResolvedValue(mockResponse);

      const payload = {
        result: CALL_ATTEMPT_RESULTS.NO_ANSWER,
        notes: "Customer did not pick up",
      };

      const result = await logCallAttemptAction("ret-1", payload);
      expect(serverApiPost).toHaveBeenCalledWith("/returns/ret-1/call-attempt", payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("assignReturnAction", () => {
    it("assigns return when authorized", async () => {
      vi.mocked(auth).mockResolvedValue(
        mockSession({
          id: "admin-1",
          role: "ADMIN",
          permissions: ["returns:write"],
        })
      );

      const mockResponse = {
        success: true,
        data: { _id: "ret-1", assignedEmployee: "emp-99" },
      };
      vi.mocked(serverApiPatch).mockResolvedValue(mockResponse);

      const payload = { employeeId: "emp-99" };
      const result = await assignReturnAction("ret-1", payload);
      expect(serverApiPatch).toHaveBeenCalledWith("/returns/ret-1/assign", payload);
      expect(result).toEqual(mockResponse);
    });
  });
});
