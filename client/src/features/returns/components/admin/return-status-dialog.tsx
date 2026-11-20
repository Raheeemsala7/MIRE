"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { ReturnDoc, ReturnStatus } from "../../types/return.types";
import { RETURN_STATUSES } from "../../types/return.types";
import {
  ALLOWED_STATUS_TRANSITIONS,
  STATUS_CONFIG,
} from "../../utils/return.util";
import { useUpdateReturnStatus } from "../../hooks/use-update-return-status";
import { ReturnStatusBadge } from "../shared/return-status-badge";

interface ReturnStatusDialogProps {
  returnDoc: ReturnDoc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale?: string;
}

export function ReturnStatusDialog({
  returnDoc,
  open,
  onOpenChange,
  locale = "en",
}: ReturnStatusDialogProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const allowedNext = ALLOWED_STATUS_TRANSITIONS[returnDoc.status] || [];
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus | "">(
    allowedNext[0] || ""
  );
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevStatus, setPrevStatus] = useState(returnDoc.status);

  if (prevOpen !== open || prevStatus !== returnDoc.status) {
    setPrevOpen(open);
    setPrevStatus(returnDoc.status);
    if (open) {
      const nextTransitions = ALLOWED_STATUS_TRANSITIONS[returnDoc.status] || [];
      setSelectedStatus(nextTransitions[0] || "");
      setNotes("");
      setShowConfirm(false);
    }
  }

  const { mutate: updateStatus, isPending } = useUpdateReturnStatus(() => {
    onOpenChange(false);
    setNotes("");
    setShowConfirm(false);
  });

  const isSensitiveTransition =
    selectedStatus === RETURN_STATUSES.REJECTED ||
    selectedStatus === RETURN_STATUSES.REFUNDED;

  function handleSubmit() {
    if (!selectedStatus) return;
    if (isSensitiveTransition) {
      setShowConfirm(true);
    } else {
      executeStatusUpdate();
    }
  }

  function executeStatusUpdate() {
    if (!selectedStatus) return;
    updateStatus({
      id: returnDoc._id,
      payload: {
        status: selectedStatus as ReturnStatus,
        notes: notes.trim() || undefined,
      },
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("return-status-update-action") || "Update Return Status"}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? `تحديث حالة طلب الإرجاع #${returnDoc.returnNumber}`
                : `Update lifecycle status for Return #${returnDoc.returnNumber}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current Status */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
              <span className="text-xs font-medium text-muted-foreground">
                {isAr ? "الحالة الحالية:" : "Current Status:"}
              </span>
              <ReturnStatusBadge status={returnDoc.status} locale={locale} />
            </div>

            {/* Next Status Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isAr ? "الحالة الجديدة:" : "New Status:"}
              </Label>
              {allowedNext.length > 0 ? (
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val as ReturnStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isAr ? "اختيار الحالة..." : "Select status..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedNext.map((status) => {
                      const cfg = STATUS_CONFIG[status];
                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <span className={`size-1.5 rounded-full ${cfg.dotClass}`} />
                            <span>{isAr ? cfg.labelAr : cfg.labelEn}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground italic rounded-md border border-border/40 p-2 bg-muted/10">
                  {isAr
                    ? "هذا الطلب وصل لحالة نهائية ولا يمكن إجراء انتقالات أخرى."
                    : "This return is in a terminal state. No further status transitions allowed."}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isAr ? "ملاحظات إضافية (اختياري):" : "Staff Notes (optional):"}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isAr
                    ? "أضف أي ملاحظات تبرر هذا التغيير أو تعليمات للمندوب/المستودع..."
                    : "Add any reason notes or instructions for couriers/warehouse..."
                }
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!selectedStatus || allowedNext.length === 0 || isPending}
            >
              {isPending
                ? isAr
                  ? "جاري الحفظ..."
                  : "Saving..."
                : t("return-status-update-action") || "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation for sensitive transitions (REJECTED / REFUNDED) */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? "تأكيد تغيير الحالة" : "Confirm Status Transition"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStatus === RETURN_STATUSES.REJECTED
                ? isAr
                  ? "هل أنت متأكد من رفض هذا المرتجع؟ رفض الطلب يعد إجراءً نهائياً."
                  : "Are you sure you want to reject this return? Rejection is a terminal lifecycle state."
                : isAr
                  ? "هل أنت متأكد من تأكيد استرداد المبلغ؟ سيتم تسجيل حالة الاسترداد كـ مكتملة."
                  : "Are you sure you want to mark this return as refunded? This confirms the refund has been processed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {isAr ? "تراجع" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeStatusUpdate}
              disabled={isPending}
              className={
                selectedStatus === RETURN_STATUSES.REJECTED
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : ""
              }
            >
              {isPending ? (isAr ? "جاري التأكيد..." : "Confirming...") : isAr ? "تأكيد" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
