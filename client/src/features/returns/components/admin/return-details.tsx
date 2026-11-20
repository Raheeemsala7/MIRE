"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Package,
  RotateCcw,
  UserCheck,
  ClipboardCheck,
  PhoneCall,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import type { SafeUser } from "@/lib/auth/types";
import type { ReturnDoc } from "../../types/return.types";
import { useReturn } from "../../hooks/use-return";
import { ReturnStatusBadge } from "../shared/return-status-badge";
import { ReturnTimeline } from "../shared/return-timeline";
import { ReturnStatusDialog } from "./return-status-dialog";
import { ReturnInspectionDialog } from "./return-inspection-dialog";
import { ReturnCallAttemptDialog } from "./return-call-attempt-dialog";
import { ReturnAssignmentDialog } from "./return-assignment-dialog";
import {
  formatCurrency,
  formatDate,
  REASON_CONFIG,
  CONDITION_CONFIG,
  CALL_RESULT_CONFIG,
  REFUND_METHOD_CONFIG,
} from "../../utils/return.util";

interface ReturnDetailsProps {
  initialReturn: ReturnDoc;
  locale: string;
  currentUser: SafeUser;
}

export function ReturnDetails({
  initialReturn,
  locale,
  currentUser,
}: ReturnDetailsProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const { data: returnData } = useReturn(initialReturn._id, {
    success: true,
    data: initialReturn,
  });
  const returnDoc = returnData?.data ?? initialReturn;

  // RBAC permissions
  const canUpdateStatus = can(
    currentUser?.role,
    PERMISSIONS.RETURNS_UPDATE_STATUS,
    currentUser?.permissions
  );
  const canInspect = can(
    currentUser?.role,
    PERMISSIONS.RETURNS_INSPECT,
    currentUser?.permissions
  );
  const canAssign = can(
    currentUser?.role,
    PERMISSIONS.RETURNS_ASSIGN,
    currentUser?.permissions
  );
  const canLogCall = can(
    currentUser?.role,
    PERMISSIONS.RETURNS_LOG_CALL,
    currentUser?.permissions
  );

  // Dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const customer =
    typeof returnDoc.customer === "object" && returnDoc.customer !== null
      ? returnDoc.customer
      : null;

  const originalOrder =
    typeof returnDoc.originalOrder === "object" && returnDoc.originalOrder !== null
      ? returnDoc.originalOrder
      : null;

  const assignedEmployee =
    typeof returnDoc.assignedEmployee === "object" && returnDoc.assignedEmployee !== null
      ? returnDoc.assignedEmployee
      : null;

  const reasonMeta = REASON_CONFIG[returnDoc.reason];
  const reasonLabel = isAr ? reasonMeta?.labelAr || returnDoc.reason : reasonMeta?.labelEn || returnDoc.reason;
  const refundMethodLabel = isAr
    ? REFUND_METHOD_CONFIG[returnDoc.refundMethod]?.labelAr || returnDoc.refundMethod
    : REFUND_METHOD_CONFIG[returnDoc.refundMethod]?.labelEn || returnDoc.refundMethod;

  return (
    <div className="space-y-6">
      {/* Top Bar with Navigation and Quick Actions */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/returns"
            className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground shadow-2xs hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl" dir="ltr">
                {returnDoc.returnNumber}
              </h1>
              <ReturnStatusBadge status={returnDoc.status} locale={locale} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
              Requested {formatDate(returnDoc.createdAt, locale)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canLogCall && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCallDialogOpen(true)}
              className="gap-1.5 text-xs h-9"
            >
              <PhoneCall className="size-3.5 text-muted-foreground" />
              <span>{t("return-log-call-action") || "Log Call"}</span>
            </Button>
          )}

          {canAssign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignDialogOpen(true)}
              className="gap-1.5 text-xs h-9"
            >
              <UserCheck className="size-3.5 text-muted-foreground" />
              <span>{t("return-assign-action") || "Assign Staff"}</span>
            </Button>
          )}

          {canInspect && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectDialogOpen(true)}
              className="gap-1.5 text-xs h-9"
            >
              <ClipboardCheck className="size-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t("return-inspect-action") || "Inspect Items"}</span>
            </Button>
          )}

          {canUpdateStatus && (
            <Button
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
              className="gap-1.5 text-xs h-9"
            >
              <RotateCcw className="size-3.5" />
              <span>{t("return-status-update-action") || "Update Status"}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Left Column: Items, Reason, and Call Attempts */}
        <div className="space-y-6 lg:col-span-2">
          {/* Returned Items Card */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Package className="size-4 text-primary" />
                <span>{t("return-details-items") || "Returned Products"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "قائمة المنتجات المطلوب إرجاعها وحالتها الفنية" : "Items requested for return and inspection status"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
                {returnDoc.items.map((item) => {
                  const condStyle = CONDITION_CONFIG[item.condition] || {
                    labelEn: item.condition,
                    labelAr: item.condition,
                    colorClass: "text-muted-foreground",
                  };

                  return (
                    <div key={item._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          {typeof item.product === "object" ? item.product.name : "Product"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-xs text-muted-foreground" dir="ltr">
                          <span>SKU: {item.sku}</span>
                          <span>·</span>
                          <span>{item.color} / {item.size}</span>
                          <span>·</span>
                          <span>Qty: {item.quantity}</span>
                          <span>·</span>
                          <span>Unit: {formatCurrency(item.unitPrice, locale)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1">
                        <span className="text-xs font-semibold text-foreground" dir="ltr">
                          {formatCurrency(item.unitPrice * item.quantity, locale)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-medium ${condStyle.colorClass}`}>
                            {isAr ? condStyle.labelAr : condStyle.labelEn}
                          </span>
                          {item.restockApproved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              {item.restockedAt
                                ? isAr ? "تم الإدراج بالمخزون" : "Restocked"
                                : isAr ? "معتمد للإدراج" : "Restock Approved"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Refund Banner */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3.5">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("returns-table-amount") || "Total Refund Amount"}:
                </span>
                <span className="text-lg font-bold text-foreground" dir="ltr">
                  {formatCurrency(returnDoc.refundAmount, locale)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Return Reason and Notes */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText className="size-4 text-primary" />
                <span>{t("returns-table-reason") || "Return Reason & Explanation"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {isAr ? "السبب المختار:" : "Declared Reason:"}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {reasonLabel}
                </p>
                {returnDoc.reasonDetails && (
                  <p className="mt-2 text-xs text-foreground/80 border-t border-border/40 pt-2">
                    {returnDoc.reasonDetails}
                  </p>
                )}
              </div>

              {/* Inspection notes if available */}
              {returnDoc.inspectionNotes && (
                <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3">
                  <p className="text-xs font-semibold text-teal-800 dark:text-teal-400 flex items-center gap-1.5">
                    <ClipboardCheck className="size-3.5" />
                    <span>{t("return-details-inspection") || "Inspection Report"}</span>
                  </p>
                  <p className="mt-1 text-xs text-foreground/90">
                    {returnDoc.inspectionNotes}
                  </p>
                  {returnDoc.inspectedAt && (
                    <p className="mt-2 text-[11px] text-muted-foreground" dir="ltr">
                      {isAr ? "تاريخ الفحص: " : "Inspected at: "}
                      {formatDate(returnDoc.inspectedAt, locale)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Follow-Up Call Attempts */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <PhoneCall className="size-4 text-primary" />
                  <span>{t("return-details-call-attempts") || "Customer Contact Attempts"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr ? "سجل متابعة الاتصالات مع العميل لتنسيق الاستلام" : "Log of customer outreach attempts"}
                </CardDescription>
              </div>
              {canLogCall && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCallDialogOpen(true)}
                  className="gap-1.5 text-xs h-8"
                >
                  <PhoneCall className="size-3.5" />
                  <span>{t("return-log-call-action") || "Log Call"}</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {returnDoc.callAttempts && returnDoc.callAttempts.length > 0 ? (
                <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
                  {returnDoc.callAttempts.map((attempt, index) => {
                    const resultStyle = CALL_RESULT_CONFIG[attempt.result] || {
                      labelEn: attempt.result,
                      labelAr: attempt.result,
                      badgeClass: "bg-muted text-foreground",
                    };

                    return (
                      <div key={attempt._id || index} className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {isAr ? `المحاولة #${attempt.attemptNumber}` : `Attempt #${attempt.attemptNumber}`}
                            </span>
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${resultStyle.badgeClass}`}>
                              {isAr ? resultStyle.labelAr : resultStyle.labelEn}
                            </span>
                          </div>
                          <time className="text-xs text-muted-foreground" dir="ltr">
                            {formatDate(attempt.attemptedAt, locale)}
                          </time>
                        </div>
                        {attempt.notes && (
                          <p className="text-xs text-muted-foreground bg-background/50 rounded p-2 border border-border/30">
                            {attempt.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic rounded-md border border-border/40 p-4 text-center bg-muted/10">
                  {isAr ? "لم يتم تسجيل أي محاولات اتصال بعد." : "No customer call attempts logged yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Column: Order, Customer, Assignment, and Activity Timeline */}
        <div className="space-y-6">
          {/* Customer & Order Information */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("return-details-customer-info") || "Customer Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground">{isAr ? "الاسم: " : "Name: "}</span>
                  <span className="font-semibold text-foreground">
                    {customer?.fullName || "—"}
                  </span>
                </div>
              </div>

              {customer?.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">{isAr ? "الهاتف: " : "Phone: "}</span>
                    <a href={`tel:${customer.phone}`} className="font-mono text-primary hover:underline" dir="ltr">
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}

              {customer?.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">{isAr ? "البريد: " : "Email: "}</span>
                    <span className="font-mono text-foreground" dir="ltr">
                      {customer.email}
                    </span>
                  </div>
                </div>
              )}

              <Separator className="my-2" />

              {/* Original Order Info */}
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                  {t("return-details-order-info") || "Original Order"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isAr ? "رقم الطلب:" : "Order #:"}</span>
                  <span className="font-mono font-semibold text-primary" dir="ltr">
                    {originalOrder?.orderNumber || (typeof returnDoc.originalOrder === "string" ? returnDoc.originalOrder : "—")}
                  </span>
                </div>
                {originalOrder?.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isAr ? "حالة الطلب:" : "Order Status:"}</span>
                    <Badge variant="outline" className="text-[11px]">
                      {originalOrder.status}
                    </Badge>
                  </div>
                )}
                {originalOrder?.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isAr ? "تاريخ الطلب:" : "Order Date:"}</span>
                    <span className="text-muted-foreground" dir="ltr">
                      {formatDate(originalOrder.createdAt, locale)}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-2" />

              {/* Refund Info */}
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                  {isAr ? "بيانات الاسترداد" : "Refund Details"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isAr ? "طريقة الاسترداد:" : "Refund Method:"}</span>
                  <span className="font-medium text-foreground">{refundMethodLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isAr ? "حالة الاسترداد:" : "Refund Status:"}</span>
                  <Badge
                    variant={returnDoc.refundStatus === "PROCESSED" ? "default" : "outline"}
                    className="text-[11px]"
                  >
                    {returnDoc.refundStatus}
                  </Badge>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Assignment Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground">
                    {t("returns-table-assignee") || "Assigned Employee"}
                  </p>
                  {canAssign && (
                    <button
                      type="button"
                      onClick={() => setAssignDialogOpen(true)}
                      className="text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      {isAr ? "تغيير" : "Change"}
                    </button>
                  )}
                </div>
                {assignedEmployee ? (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                    <p className="font-medium text-foreground">{assignedEmployee.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">{assignedEmployee.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {assignedEmployee.role.replace("_", " ")}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {isAr ? "لم يتم تعيين موظف لهذا الطلب." : "No employee assigned yet."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline Card */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("return-details-history") || "Status History"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <ReturnTimeline history={returnDoc.statusHistory} locale={locale} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ReturnStatusDialog
        returnDoc={returnDoc}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        locale={locale}
      />

      <ReturnInspectionDialog
        returnDoc={returnDoc}
        open={inspectDialogOpen}
        onOpenChange={setInspectDialogOpen}
        locale={locale}
      />

      <ReturnCallAttemptDialog
        returnDoc={returnDoc}
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        locale={locale}
      />

      <ReturnAssignmentDialog
        returnDoc={returnDoc}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        locale={locale}
      />
    </div>
  );
}
