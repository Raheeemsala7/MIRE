import { describe, expect, it } from "vitest";
import {
  requestReturnSchema,
  updateReturnStatusSchema,
  inspectReturnSchema,
  logCallAttemptSchema,
  assignReturnSchema,
  returnsFilterSchema,
} from "./return.schema";
import {
  RETURN_STATUSES,
  RETURN_REASONS,
  ITEM_CONDITIONS,
  CALL_ATTEMPT_RESULTS,
  REFUND_METHODS,
} from "../types/return.types";

describe("Return Schemas Validation", () => {
  describe("requestReturnSchema", () => {
    it("validates a complete, valid customer return request", () => {
      const payload = {
        originalOrderId: "ord-12345",
        items: [
          {
            productId: "prod-1",
            sku: "SKU-BLK-M",
            color: "Black",
            size: "M",
            quantity: 2,
            unitPrice: 1500,
          },
        ],
        reason: RETURN_REASONS.SIZE_TOO_LARGE,
        reasonDetails: "Too loose around the waist",
        refundMethod: REFUND_METHODS.ORIGINAL_PAYMENT,
      };

      const result = requestReturnSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("validates multiple order line items where only partial quantities are returned", () => {
      const payload = {
        originalOrderId: "ord-multi-line",
        items: [
          {
            productId: "prod-1",
            sku: "SKU-ABAYA-BLK-M",
            color: "Black",
            size: "M",
            quantity: 1, // 1 out of 3 ordered
            unitPrice: 1200,
          },
          {
            productId: "prod-2",
            sku: "SKU-SCARF-BEG-ONESIZE",
            color: "Beige",
            size: "One Size",
            quantity: 2, // 2 out of 5 ordered
            unitPrice: 350,
          },
        ],
        reason: RETURN_REASONS.CHANGED_MIND,
        refundMethod: REFUND_METHODS.CASH,
      };

      const result = requestReturnSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.items[0].quantity).toBe(1);
        expect(result.data.items[1].quantity).toBe(2);
      }
    });

    it("rejects when items array is empty", () => {
      const payload = {
        originalOrderId: "ord-12345",
        items: [],
        reason: RETURN_REASONS.DEFECTIVE,
        refundMethod: REFUND_METHODS.CASH,
      };

      const result = requestReturnSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one item");
      }
    });

    it("rejects when item quantity is less than 1 or not integer", () => {
      const payload = {
        originalOrderId: "ord-12345",
        items: [
          {
            productId: "prod-1",
            sku: "SKU-1",
            color: "Red",
            size: "S",
            quantity: 0,
            unitPrice: 500,
          },
        ],
        reason: RETURN_REASONS.CHANGED_MIND,
        refundMethod: REFUND_METHODS.CASH,
      };

      const result = requestReturnSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects an unsupported reason code", () => {
      const payload = {
        originalOrderId: "ord-12345",
        items: [
          {
            productId: "prod-1",
            sku: "SKU-1",
            color: "Red",
            size: "S",
            quantity: 1,
            unitPrice: 500,
          },
        ],
        reason: "INVALID_REASON",
        refundMethod: REFUND_METHODS.CASH,
      };

      const result = requestReturnSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("updateReturnStatusSchema", () => {
    it("accepts all valid backend return statuses", () => {
      for (const status of Object.values(RETURN_STATUSES)) {
        const result = updateReturnStatusSchema.safeParse({
          status,
          notes: "Status update test note",
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects an invalid status string", () => {
      const result = updateReturnStatusSchema.safeParse({
        status: "NON_EXISTENT_STATUS",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("inspectReturnSchema", () => {
    it("validates valid inspection input", () => {
      const payload = {
        inspectionNotes: "Item in pristine condition with tags attached.",
        itemInspections: [
          {
            itemId: "item-abc-1",
            condition: ITEM_CONDITIONS.TAGS_ATTACHED,
            restockApproved: true,
          },
        ],
      };

      const result = inspectReturnSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("validates multi-item inspection with mixed condition and restock approvals", () => {
      const payload = {
        inspectionNotes: "Item 1 is unopened and approved for restock. Item 2 is damaged by customer.",
        itemInspections: [
          {
            itemId: "item-1",
            condition: ITEM_CONDITIONS.UNOPENED,
            restockApproved: true,
          },
          {
            itemId: "item-2",
            condition: ITEM_CONDITIONS.DAMAGED,
            restockApproved: false,
          },
        ],
      };

      const result = inspectReturnSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemInspections).toHaveLength(2);
        expect(result.data.itemInspections[0].restockApproved).toBe(true);
        expect(result.data.itemInspections[1].restockApproved).toBe(false);
      }
    });

    it("rejects when inspectionNotes is shorter than 3 characters", () => {
      const payload = {
        inspectionNotes: "Ok",
        itemInspections: [
          {
            itemId: "item-abc-1",
            condition: ITEM_CONDITIONS.TAGS_ATTACHED,
            restockApproved: true,
          },
        ],
      };

      const result = inspectReturnSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects when itemInspections list is empty", () => {
      const payload = {
        inspectionNotes: "Inspection completed.",
        itemInspections: [],
      };

      const result = inspectReturnSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("logCallAttemptSchema", () => {
    it("accepts all valid call outcomes", () => {
      for (const outcome of Object.values(CALL_ATTEMPT_RESULTS)) {
        const result = logCallAttemptSchema.safeParse({
          result: outcome,
          notes: "Customer contacted",
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects an unknown call outcome", () => {
      const result = logCallAttemptSchema.safeParse({
        result: "UNKNOWN_OUTCOME",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("assignReturnSchema", () => {
    it("accepts non-empty employeeId", () => {
      const result = assignReturnSchema.safeParse({
        employeeId: "emp-7788",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty employeeId", () => {
      const result = assignReturnSchema.safeParse({
        employeeId: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("returnsFilterSchema", () => {
    it("coerces string numbers to integers and supplies defaults", () => {
      const result = returnsFilterSchema.safeParse({
        page: "2",
        limit: "50",
        status: "RETURN_REQUESTED",
        search: "RET-2026",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.status).toBe("RETURN_REQUESTED");
      }
    });
  });
});
