"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Eye,
  RotateCcw,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import type { ReturnDoc } from "../../types/return.types";
import { ReturnStatusBadge } from "../shared/return-status-badge";
import {
  formatCurrency,
  formatDate,
  REASON_CONFIG,
  CALL_RESULT_CONFIG,
} from "../../utils/return.util";

interface ReturnsTableProps {
  returns: ReturnDoc[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  locale?: string;
  isPending?: boolean;
}

export const ReturnsTable = React.memo(function ReturnsTable({
  returns,
  total,
  page,
  limit,
  onPageChange,
  locale = "en",
  isPending = false,
}: ReturnsTableProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const totalPages = Math.ceil(total / limit) || 1;
  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  if (returns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted/50 text-muted-foreground ring-1 ring-border">
          <RotateCcw className="size-6 stroke-1.5" />
        </div>
        <h3 className="mt-4 font-serif text-lg font-medium text-foreground">
          {t("returns-empty-title") || "No returns found"}
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {t("returns-empty-description") ||
            "There are no return requests matching your current filter criteria."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-id") || "Return #"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-order") || "Order #"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-customer") || "Customer"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-date") || "Requested Date"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-reason") || "Reason"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-status") || "Status"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-amount") || "Refund Amount"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-inspection") || "Inspection"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-contact") || "Last Contact"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                {t("returns-table-assignee") || "Assigned Staff"}
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground uppercase text-end">
                {t("returns-table-actions") || "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {returns.map((ret) => {
              const customerName =
                typeof ret.customer === "object" && ret.customer !== null
                  ? ret.customer.fullName
                  : "—";
              const customerPhone =
                typeof ret.customer === "object" && ret.customer !== null
                  ? ret.customer.phone
                  : null;

              const orderNumber =
                typeof ret.originalOrder === "object" && ret.originalOrder !== null
                  ? ret.originalOrder.orderNumber
                  : typeof ret.originalOrder === "string"
                    ? ret.originalOrder
                    : "—";

              const assignedEmployeeName =
                typeof ret.assignedEmployee === "object" && ret.assignedEmployee !== null
                  ? ret.assignedEmployee.name
                  : null;

              const reasonMeta = REASON_CONFIG[ret.reason];
              const reasonLabel = isAr
                ? reasonMeta?.labelAr || ret.reason
                : reasonMeta?.labelEn || ret.reason;

              return (
                <TableRow
                  key={ret._id}
                  className="transition-colors hover:bg-muted/20 border-border/60"
                >
                  {/* Return ID */}
                  <TableCell className="font-medium text-foreground">
                    <span className="font-mono text-xs font-semibold text-primary" dir="ltr">
                      {ret.returnNumber}
                    </span>
                  </TableCell>

                  {/* Order Number */}
                  <TableCell className="text-foreground">
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {orderNumber}
                    </span>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {customerName}
                      </span>
                      {customerPhone && (
                        <span className="text-xs text-muted-foreground" dir="ltr">
                          {customerPhone}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Requested Date */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" dir="ltr">
                      <Calendar className="size-3.5 shrink-0 opacity-70" />
                      <span>{formatDate(ret.createdAt, locale)}</span>
                    </div>
                  </TableCell>

                  {/* Reason */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[140px]" title={reasonLabel}>
                      {reasonLabel}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <ReturnStatusBadge status={ret.status} locale={locale} />
                  </TableCell>

                  {/* Refund Amount */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground" dir="ltr">
                        {formatCurrency(ret.refundAmount, locale)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {ret.items?.length || 0} {isAr ? "قطع" : "items"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Inspection Status */}
                  <TableCell>
                    {ret.inspectedAt || ret.status === "INSPECTED" ? (
                      <Badge variant="outline" className="text-[11px] font-normal gap-1 py-0.5 border-teal-500/30 text-teal-700 dark:text-teal-400 bg-teal-500/10">
                        <ClipboardCheck className="size-3" />
                        <span>{isAr ? "مفحوص" : "Inspected"}</span>
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">
                        {isAr ? "قيد الفحص" : "Pending"}
                      </span>
                    )}
                  </TableCell>

                  {/* Last Contact Attempt */}
                  <TableCell>
                    {ret.callAttempts && ret.callAttempts.length > 0 ? (
                      (() => {
                        const last = ret.callAttempts[ret.callAttempts.length - 1];
                        const cfg = CALL_RESULT_CONFIG[last.result];
                        return (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {isAr ? cfg?.labelAr || last.result : cfg?.labelEn || last.result}
                            </span>
                            <span className="text-[10px] text-muted-foreground" dir="ltr">
                              {formatDate(last.attemptedAt, locale)}
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">—</span>
                    )}
                  </TableCell>

                  {/* Assigned Staff */}
                  <TableCell>
                    {assignedEmployeeName ? (
                      <Badge variant="outline" className="text-xs font-normal gap-1 py-0.5">
                        <User className="size-3 text-muted-foreground" />
                        <span>{assignedEmployeeName}</span>
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">
                        {isAr ? "غير معين" : "Unassigned"}
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-end">
                    <Link
                      href={`/admin/returns/${ret._id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Eye className="size-3.5 me-1.5 text-muted-foreground" />
                      <span>{t("returns-view-details") || "View"}</span>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground" dir={isAr ? "rtl" : "ltr"}>
          {isAr
            ? `عرض ${startRecord} إلى ${endRecord} من أصل ${total} طلب`
            : `Showing ${startRecord} to ${endRecord} of ${total} returns`}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isPending}
            className="h-8 gap-1 text-xs"
          >
            <ChevronLeft className="size-3.5 rtl:rotate-180" />
            <span>{t("returns-pagination-prev") || "Previous"}</span>
          </Button>
          <span className="text-xs text-muted-foreground px-2" dir="ltr">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isPending}
            className="h-8 gap-1 text-xs"
          >
            <span>{t("returns-pagination-next") || "Next"}</span>
            <ChevronRight className="size-3.5 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
});
