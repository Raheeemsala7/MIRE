import type {
  ReturnStatus,
  ReturnReason,
  ItemCondition,
  CallAttemptResult,
  RefundMethod,
} from "../types/return.types";
import {
  RETURN_STATUSES,
  RETURN_REASONS,
  ITEM_CONDITIONS,
  CALL_ATTEMPT_RESULTS,
  REFUND_METHODS,
} from "../types/return.types";

export interface StatusStyle {
  labelEn: string;
  labelAr: string;
  badgeClass: string;
  dotClass: string;
}

export const STATUS_CONFIG: Record<ReturnStatus, StatusStyle> = {
  [RETURN_STATUSES.RETURN_REQUESTED]: {
    labelEn: "Requested",
    labelAr: "طلب جديد",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  [RETURN_STATUSES.RETURN_APPROVED]: {
    labelEn: "Approved",
    labelAr: "معتمد",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  [RETURN_STATUSES.PICKUP_SCHEDULED]: {
    labelEn: "Pickup Scheduled",
    labelAr: "جدولة مندوب الاستلام",
    badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
    dotClass: "bg-indigo-500",
  },
  [RETURN_STATUSES.PICKED_UP]: {
    labelEn: "Picked Up",
    labelAr: "تم الاستلام من العميل",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    dotClass: "bg-purple-500",
  },
  [RETURN_STATUSES.RECEIVED]: {
    labelEn: "Received at Warehouse",
    labelAr: "وصل المستودع",
    badgeClass: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
    dotClass: "bg-cyan-500",
  },
  [RETURN_STATUSES.INSPECTED]: {
    labelEn: "Inspected",
    labelAr: "تم الفحص الفني",
    badgeClass: "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400",
    dotClass: "bg-teal-500",
  },
  [RETURN_STATUSES.REFUNDED]: {
    labelEn: "Refunded",
    labelAr: "تم رد المبلغ",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  [RETURN_STATUSES.REJECTED]: {
    labelEn: "Rejected",
    labelAr: "مرفوض",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
    dotClass: "bg-rose-500",
  },
};

export const REASON_CONFIG: Record<ReturnReason, { labelEn: string; labelAr: string }> = {
  [RETURN_REASONS.SIZE_TOO_SMALL]: { labelEn: "Size too small", labelAr: "المقاس صغير جداً" },
  [RETURN_REASONS.SIZE_TOO_LARGE]: { labelEn: "Size too large", labelAr: "المقاس كبير جداً" },
  [RETURN_REASONS.NOT_AS_PICTURED]: { labelEn: "Not as pictured", labelAr: "المنتج لا يطابق الصورة" },
  [RETURN_REASONS.DEFECTIVE]: { labelEn: "Defective / Damaged", labelAr: "عيب صناعة / تالف" },
  [RETURN_REASONS.CHANGED_MIND]: { labelEn: "Changed mind", labelAr: "تراجع عن الشراء" },
  [RETURN_REASONS.WRONG_ITEM_SENT]: { labelEn: "Wrong item sent", labelAr: "تم استلام منتج خاطئ" },
  [RETURN_REASONS.OTHER]: { labelEn: "Other", labelAr: "أسباب أخرى" },
};

export const CONDITION_CONFIG: Record<ItemCondition, { labelEn: string; labelAr: string; colorClass: string }> = {
  [ITEM_CONDITIONS.PENDING_INSPECTION]: {
    labelEn: "Pending Inspection",
    labelAr: "في انتظار الفحص",
    colorClass: "text-amber-500",
  },
  [ITEM_CONDITIONS.UNOPENED]: {
    labelEn: "Unopened & Sealed",
    labelAr: "جديد ومغلق بالغلاف الأصلي",
    colorClass: "text-emerald-500",
  },
  [ITEM_CONDITIONS.TAGS_ATTACHED]: {
    labelEn: "Tags Attached (Unworn)",
    labelAr: "غير مستخدم وبالملصقات الأصلية",
    colorClass: "text-teal-500",
  },
  [ITEM_CONDITIONS.WORN]: {
    labelEn: "Worn / Used",
    labelAr: "مستعمل / تم ارتداؤه",
    colorClass: "text-rose-500",
  },
  [ITEM_CONDITIONS.DAMAGED]: {
    labelEn: "Damaged by Customer",
    labelAr: "تالف بسوء استخدام العميل",
    colorClass: "text-rose-600",
  },
  [ITEM_CONDITIONS.DEFECTIVE]: {
    labelEn: "Manufacturing Defect",
    labelAr: "عيب صناعي مؤكد",
    colorClass: "text-purple-500",
  },
};

export const CALL_RESULT_CONFIG: Record<CallAttemptResult, { labelEn: string; labelAr: string; badgeClass: string }> = {
  [CALL_ATTEMPT_RESULTS.NO_ANSWER]: {
    labelEn: "No Answer",
    labelAr: "لا يوجد رد",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  [CALL_ATTEMPT_RESULTS.CUSTOMER_REFUSED]: {
    labelEn: "Customer Refused Return",
    labelAr: "العميل رفض تسليم المرتجع",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  [CALL_ATTEMPT_RESULTS.CUSTOMER_CONFIRMED]: {
    labelEn: "Customer Confirmed Pickup",
    labelAr: "العميل أكد موعد الاستلام",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  [CALL_ATTEMPT_RESULTS.RESCHEDULED]: {
    labelEn: "Pickup Rescheduled",
    labelAr: "تمت إعادة الجدولة",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
};

export const REFUND_METHOD_CONFIG: Record<RefundMethod, { labelEn: string; labelAr: string }> = {
  [REFUND_METHODS.CASH]: { labelEn: "Cash", labelAr: "نقداً" },
  [REFUND_METHODS.ORIGINAL_PAYMENT]: { labelEn: "Original Payment Method", labelAr: "طريقة الدفع الأصلية" },
  [REFUND_METHODS.STORE_CREDIT]: { labelEn: "Store Credit", labelAr: "رصيد في المتجر" },
  [REFUND_METHODS.WALLET]: { labelEn: "Digital Wallet", labelAr: "محفظة إلكترونية" },
};

/**
 * Valid allowed next status transitions based on the return lifecycle.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<ReturnStatus, readonly ReturnStatus[]> = {
  [RETURN_STATUSES.RETURN_REQUESTED]: [
    RETURN_STATUSES.RETURN_APPROVED,
    RETURN_STATUSES.REJECTED,
  ],
  [RETURN_STATUSES.RETURN_APPROVED]: [
    RETURN_STATUSES.PICKUP_SCHEDULED,
    RETURN_STATUSES.REJECTED,
  ],
  [RETURN_STATUSES.PICKUP_SCHEDULED]: [
    RETURN_STATUSES.PICKED_UP,
    RETURN_STATUSES.REJECTED,
  ],
  [RETURN_STATUSES.PICKED_UP]: [
    RETURN_STATUSES.RECEIVED,
    RETURN_STATUSES.REJECTED,
  ],
  [RETURN_STATUSES.RECEIVED]: [
    RETURN_STATUSES.INSPECTED,
    RETURN_STATUSES.REJECTED,
  ],
  [RETURN_STATUSES.INSPECTED]: [
    RETURN_STATUSES.REFUNDED,
    RETURN_STATUSES.REJECTED,
  ],
  [RETURN_STATUSES.REFUNDED]: [],
  [RETURN_STATUSES.REJECTED]: [],
};

export function getStatusStyle(status: ReturnStatus): StatusStyle {
  return (
    STATUS_CONFIG[status] || {
      labelEn: status,
      labelAr: status,
      badgeClass: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      dotClass: "bg-gray-500",
    }
  );
}

export function formatCurrency(amount: number, locale = "en"): string {
  const isAr = locale === "ar";
  return `${amount.toLocaleString(isAr ? "ar-EG" : "en-US")} ${isAr ? "ج.م" : "EGP"}`;
}

export function formatDate(dateString: string | null | undefined, locale = "en"): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}
