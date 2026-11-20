export const RETURN_STATUSES = {
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURN_APPROVED: "RETURN_APPROVED",
  PICKUP_SCHEDULED: "PICKUP_SCHEDULED",
  PICKED_UP: "PICKED_UP",
  RECEIVED: "RECEIVED",
  INSPECTED: "INSPECTED",
  REFUNDED: "REFUNDED",
  REJECTED: "REJECTED",
} as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[keyof typeof RETURN_STATUSES];

export const RETURN_REASONS = {
  SIZE_TOO_SMALL: "SIZE_TOO_SMALL",
  SIZE_TOO_LARGE: "SIZE_TOO_LARGE",
  NOT_AS_PICTURED: "NOT_AS_PICTURED",
  DEFECTIVE: "DEFECTIVE",
  CHANGED_MIND: "CHANGED_MIND",
  WRONG_ITEM_SENT: "WRONG_ITEM_SENT",
  OTHER: "OTHER",
} as const;

export type ReturnReason = (typeof RETURN_REASONS)[keyof typeof RETURN_REASONS];

export const ITEM_CONDITIONS = {
  PENDING_INSPECTION: "PENDING_INSPECTION",
  UNOPENED: "UNOPENED",
  TAGS_ATTACHED: "TAGS_ATTACHED",
  WORN: "WORN",
  DAMAGED: "DAMAGED",
  DEFECTIVE: "DEFECTIVE",
} as const;

export type ItemCondition = (typeof ITEM_CONDITIONS)[keyof typeof ITEM_CONDITIONS];

export const CALL_ATTEMPT_RESULTS = {
  NO_ANSWER: "NO_ANSWER",
  CUSTOMER_REFUSED: "CUSTOMER_REFUSED",
  CUSTOMER_CONFIRMED: "CUSTOMER_CONFIRMED",
  RESCHEDULED: "RESCHEDULED",
} as const;

export type CallAttemptResult = (typeof CALL_ATTEMPT_RESULTS)[keyof typeof CALL_ATTEMPT_RESULTS];

export const REFUND_METHODS = {
  CASH: "CASH",
  ORIGINAL_PAYMENT: "ORIGINAL_PAYMENT",
  STORE_CREDIT: "STORE_CREDIT",
  WALLET: "WALLET",
} as const;

export type RefundMethod = (typeof REFUND_METHODS)[keyof typeof REFUND_METHODS];

export interface ReturnItemProduct {
  _id: string;
  name: string;
  images?: Array<{ url: string; isPrimary?: boolean } | string>;
}

export interface ReturnItem {
  _id: string;
  product: string | ReturnItemProduct;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  condition: ItemCondition;
  restockApproved: boolean;
  restockedAt?: string | null;
}

export interface CallAttempt {
  _id?: string;
  attemptNumber: number;
  result: CallAttemptResult;
  notes?: string;
  attemptedAt: string;
  attemptedBy?: {
    _id: string;
    name: string;
    role: string;
  } | string | null;
}

export interface StatusHistoryEntry {
  _id?: string;
  status: ReturnStatus;
  changedBy?: {
    _id: string;
    name: string;
    role: string;
  } | string | null;
  notes?: string;
  timestamp: string;
}

export interface ReturnCustomer {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

export interface ReturnOriginalOrder {
  _id: string;
  orderNumber: string;
  status?: string;
  createdAt?: string;
  items?: Array<{
    product: string;
    name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface ReturnAssignedEmployee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface ReturnDoc {
  _id: string;
  returnNumber: string;
  originalOrder: ReturnOriginalOrder | string;
  customer: ReturnCustomer | string | null;
  items: ReturnItem[];
  reason: ReturnReason;
  reasonDetails?: string;
  status: ReturnStatus;
  refundAmount: number;
  refundMethod: RefundMethod;
  refundStatus: "PENDING" | "PROCESSED" | "FAILED";
  assignedEmployee?: ReturnAssignedEmployee | string | null;
  inspectionNotes?: string;
  inspectedBy?: {
    _id: string;
    name: string;
    role: string;
  } | string | null;
  inspectedAt?: string | null;
  callAttempts: CallAttempt[];
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnsFilterParams {
  status?: string;
  assignedEmployee?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ReturnsPaginatedResponse {
  success: boolean;
  message?: string;
  data: ReturnDoc[];
  page: number;
  limit: number;
  total: number;
}

export interface SingleReturnResponse {
  success: boolean;
  message?: string;
  data: ReturnDoc;
}

export interface RequestReturnItemInput {
  productId: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface RequestReturnPayload {
  originalOrderId: string;
  items: RequestReturnItemInput[];
  reason: ReturnReason;
  reasonDetails?: string;
  refundMethod?: RefundMethod;
}

export interface UpdateReturnStatusPayload {
  status: ReturnStatus;
  notes?: string;
}

export interface ItemInspectionInput {
  itemId: string;
  condition: ItemCondition;
  restockApproved: boolean;
}

export interface InspectReturnPayload {
  inspectionNotes: string;
  itemInspections: ItemInspectionInput[];
}

export interface LogCallAttemptPayload {
  result: CallAttemptResult;
  notes?: string;
}

export interface AssignReturnPayload {
  employeeId: string;
}

export interface ReturnsOverviewStats {
  total: number;
  pending: number;
  approved: number;
  inTransit: number;
  inspected: number;
  refunded: number;
  rejected: number;
}

