import { z } from "zod";
import {
  RETURN_STATUSES,
  RETURN_REASONS,
  ITEM_CONDITIONS,
  CALL_ATTEMPT_RESULTS,
  REFUND_METHODS,
} from "../types/return.types";

export const requestReturnItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  sku: z.string().min(1, "SKU is required"),
  color: z.string().min(1, "Color is required"),
  size: z.string().min(1, "Size is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

export const requestReturnSchema = z.object({
  originalOrderId: z.string().min(1, "Original Order ID is required"),
  items: z.array(requestReturnItemSchema).min(1, "At least one item must be returned"),
  reason: z.enum([
    RETURN_REASONS.SIZE_TOO_SMALL,
    RETURN_REASONS.SIZE_TOO_LARGE,
    RETURN_REASONS.NOT_AS_PICTURED,
    RETURN_REASONS.DEFECTIVE,
    RETURN_REASONS.CHANGED_MIND,
    RETURN_REASONS.WRONG_ITEM_SENT,
    RETURN_REASONS.OTHER,
  ]),
  reasonDetails: z.string().max(1000).optional(),
  refundMethod: z.enum([
    REFUND_METHODS.CASH,
    REFUND_METHODS.ORIGINAL_PAYMENT,
    REFUND_METHODS.STORE_CREDIT,
    REFUND_METHODS.WALLET,
  ]),
});

export type RequestReturnSchemaInput = z.infer<typeof requestReturnSchema>;

export const updateReturnStatusSchema = z.object({
  status: z.enum([
    RETURN_STATUSES.RETURN_REQUESTED,
    RETURN_STATUSES.RETURN_APPROVED,
    RETURN_STATUSES.PICKUP_SCHEDULED,
    RETURN_STATUSES.PICKED_UP,
    RETURN_STATUSES.RECEIVED,
    RETURN_STATUSES.INSPECTED,
    RETURN_STATUSES.REFUNDED,
    RETURN_STATUSES.REJECTED,
  ]),
  notes: z.string().max(500).optional(),
});

export type UpdateReturnStatusSchemaInput = z.infer<typeof updateReturnStatusSchema>;

export const itemInspectionSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  condition: z.enum([
    ITEM_CONDITIONS.UNOPENED,
    ITEM_CONDITIONS.TAGS_ATTACHED,
    ITEM_CONDITIONS.WORN,
    ITEM_CONDITIONS.DAMAGED,
    ITEM_CONDITIONS.DEFECTIVE,
  ]),
  restockApproved: z.boolean(),
});

export const inspectReturnSchema = z.object({
  inspectionNotes: z.string().min(3, "Inspection notes must be at least 3 characters"),
  itemInspections: z.array(itemInspectionSchema).min(1, "At least one item inspection required"),
});

export type InspectReturnSchemaInput = z.infer<typeof inspectReturnSchema>;

export const logCallAttemptSchema = z.object({
  result: z.enum([
    CALL_ATTEMPT_RESULTS.NO_ANSWER,
    CALL_ATTEMPT_RESULTS.CUSTOMER_REFUSED,
    CALL_ATTEMPT_RESULTS.CUSTOMER_CONFIRMED,
    CALL_ATTEMPT_RESULTS.RESCHEDULED,
  ]),
  notes: z.string().max(500).optional(),
});

export type LogCallAttemptSchemaInput = z.infer<typeof logCallAttemptSchema>;

export const assignReturnSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
});

export type AssignReturnSchemaInput = z.infer<typeof assignReturnSchema>;

export const returnsFilterSchema = z.object({
  status: z.string().optional(),
  assignedEmployee: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
});

export type ReturnsFilterSchemaInput = z.infer<typeof returnsFilterSchema>;
