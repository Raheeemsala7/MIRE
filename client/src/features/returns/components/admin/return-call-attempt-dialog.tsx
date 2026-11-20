"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { PhoneCall, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
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
import type { ReturnDoc, CallAttemptResult } from "../../types/return.types";
import { CALL_ATTEMPT_RESULTS } from "../../types/return.types";
import { CALL_RESULT_CONFIG } from "../../utils/return.util";
import { useLogCallAttempt } from "../../hooks/use-log-call-attempt";

interface ReturnCallAttemptDialogProps {
  returnDoc: ReturnDoc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale?: string;
}

export function ReturnCallAttemptDialog({
  returnDoc,
  open,
  onOpenChange,
  locale = "en",
}: ReturnCallAttemptDialogProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const [result, setResult] = useState<CallAttemptResult>(
    CALL_ATTEMPT_RESULTS.NO_ANSWER
  );
  const [notes, setNotes] = useState("");

  const { mutate: logCall, isPending } = useLogCallAttempt(() => {
    onOpenChange(false);
    setNotes("");
  });

  const isCustomerRefused = result === CALL_ATTEMPT_RESULTS.CUSTOMER_REFUSED;

  function handleSubmit() {
    logCall({
      id: returnDoc._id,
      payload: {
        result,
        notes: notes.trim() || undefined,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="size-4 text-primary" />
            <span>{t("return-log-call-action") || "Log Customer Call Attempt"}</span>
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? `تسجيل نتيجة محاولة التواصل الهاتفي مع العميل لطلب #${returnDoc.returnNumber}`
              : `Record customer phone contact outcome for Return #${returnDoc.returnNumber}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Result Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {isAr ? "نتيجة الاتصال:" : "Call Outcome:"}
            </Label>
            <Select
              value={result}
              onValueChange={(val) => setResult(val as CallAttemptResult)}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CALL_ATTEMPT_RESULTS).map((res) => {
                  const cfg = CALL_RESULT_CONFIG[res];
                  return (
                    <SelectItem key={res} value={res}>
                      <span>{isAr ? cfg.labelAr : cfg.labelEn}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Refusal Warning */}
          {isCustomerRefused && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-semibold">
                  {isAr ? "تنبيه تغيير الحالة تلقائياً:" : "Automatic Rejection Notice:"}
                </p>
                <p className="mt-0.5 opacity-90">
                  {isAr
                    ? "تسجيل رفض العميل سيؤدي تلقائياً إلى تحويل حالة طلب الإرجاع إلى (مرفوض)."
                    : "Recording that the customer refused pickup automatically updates this return status to REJECTED."}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {isAr ? "تفاصيل المحادثة والملاحظات:" : "Call Notes / Remarks:"}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAr
                  ? "سجّل وقت الاتصال، رد العميل، أو الموعد البديل المتفق عليه..."
                  : "Record call time, customer feedback, or agreed alternative schedule..."
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
            disabled={isPending}
            className={isCustomerRefused ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}
          >
            {isPending
              ? isAr
                ? "جاري التسجيل..."
                : "Logging..."
              : isAr
                ? "تسجيل الاتصال"
                : "Log Call"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
