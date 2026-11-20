"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
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
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type {
  ReturnDoc,
  ItemCondition,
  ItemInspectionInput,
} from "../../types/return.types";
import { ITEM_CONDITIONS } from "../../types/return.types";
import { CONDITION_CONFIG } from "../../utils/return.util";
import { useInspectReturn } from "../../hooks/use-inspect-return";

interface ReturnInspectionDialogProps {
  returnDoc: ReturnDoc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale?: string;
}

export function ReturnInspectionDialog({
  returnDoc,
  open,
  onOpenChange,
  locale = "en",
}: ReturnInspectionDialogProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  // Initial inspections map
  const [inspections, setInspections] = useState<Record<string, ItemInspectionInput>>(() => {
    const initial: Record<string, ItemInspectionInput> = {};
    for (const item of returnDoc.items) {
      initial[item._id] = {
        itemId: item._id,
        condition:
          item.condition !== ITEM_CONDITIONS.PENDING_INSPECTION
            ? item.condition
            : ITEM_CONDITIONS.TAGS_ATTACHED,
        restockApproved: item.restockApproved || false,
      };
    }
    return initial;
  });

  const [notes, setNotes] = useState(returnDoc.inspectionNotes || "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevReturnId, setPrevReturnId] = useState(returnDoc._id);

  if (prevOpen !== open || prevReturnId !== returnDoc._id) {
    setPrevOpen(open);
    setPrevReturnId(returnDoc._id);
    if (open) {
      const initial: Record<string, ItemInspectionInput> = {};
      for (const item of returnDoc.items) {
        initial[item._id] = {
          itemId: item._id,
          condition:
            item.condition !== ITEM_CONDITIONS.PENDING_INSPECTION
              ? item.condition
              : ITEM_CONDITIONS.TAGS_ATTACHED,
          restockApproved: item.restockApproved || false,
        };
      }
      setInspections(initial);
      setNotes(returnDoc.inspectionNotes || "");
      setShowConfirm(false);
    }
  }

  const { mutate: inspect, isPending } = useInspectReturn(() => {
    onOpenChange(false);
    setShowConfirm(false);
  });

  function handleConditionChange(itemId: string, condition: ItemCondition) {
    setInspections((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        condition,
        // If worn or damaged, default restockApproved to false for safety
        restockApproved:
          condition === ITEM_CONDITIONS.WORN || condition === ITEM_CONDITIONS.DAMAGED
            ? false
            : prev[itemId]?.restockApproved ?? false,
      },
    }));
  }

  function handleRestockChange(itemId: string, checked: boolean) {
    setInspections((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        restockApproved: checked,
      },
    }));
  }

  const hasAnyRestockApproved = Object.values(inspections).some((i) => i.restockApproved);

  function handleSubmit() {
    if (notes.trim().length < 3) return;
    if (hasAnyRestockApproved) {
      setShowConfirm(true);
    } else {
      executeInspection();
    }
  }

  function executeInspection() {
    const itemInspectionsList: ItemInspectionInput[] = returnDoc.items.map((item) => ({
      itemId: item._id,
      condition: inspections[item._id]?.condition || ITEM_CONDITIONS.TAGS_ATTACHED,
      restockApproved: inspections[item._id]?.restockApproved || false,
    }));

    inspect({
      id: returnDoc._id,
      payload: {
        inspectionNotes: notes.trim(),
        itemInspections: itemInspectionsList,
      },
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("return-inspect-action") || "Inspect Returned Items"}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? "تقييم حالة القطع المستلمة وتحديد أهلية إعادتها إلى مخزون المستودع."
                : "Evaluate physical item conditions and conditionally approve restocking back into inventory."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Inventory Safety Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">
                  {isAr ? "ضوابط سلامة المخزون:" : "Inventory Integrity Policy:"}
                </p>
                <p className="mt-0.5 opacity-90">
                  {isAr
                    ? "إعادة الإدراج في المخزون تتم تلقائياً عبر الخادم للمنتجات المعتمدة فقط. المنتجات التالفة أو المستعملة يجب عدم إقرار إرجاعها للمخزون."
                    : "Atomic inventory restocking occurs strictly for approved items. Worn or damaged items must not be restocked."}
                </p>
              </div>
            </div>

            {/* Items Inspection List */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isAr ? "القطع الخاضعة للفحص:" : "Items under inspection:"}
              </Label>
              <div className="space-y-3">
                {returnDoc.items.map((item) => {
                  const currentInsp = inspections[item._id] || {
                    itemId: item._id,
                    condition: ITEM_CONDITIONS.TAGS_ATTACHED,
                    restockApproved: false,
                  };
                  const isAlreadyRestocked = Boolean(item.restockedAt);

                  return (
                    <div
                      key={item._id}
                      className="rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {typeof item.product === "object" ? item.product.name : "Product"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                            SKU: {item.sku} · {item.color} / {item.size} · Qty: {item.quantity}
                          </p>
                        </div>
                        {isAlreadyRestocked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            {isAr ? "تم إدراجها بالمخزون سابقاً" : "Restocked previously"}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        {/* Condition selector */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {isAr ? "حالة القطعة:" : "Physical Condition:"}
                          </Label>
                          <Select
                            value={currentInsp.condition}
                            onValueChange={(val) =>
                              handleConditionChange(item._id, val as ItemCondition)
                            }
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ITEM_CONDITIONS)
                                .filter((c) => c !== ITEM_CONDITIONS.PENDING_INSPECTION)
                                .map((cond) => {
                                  const cfg = CONDITION_CONFIG[cond];
                                  return (
                                    <SelectItem key={cond} value={cond}>
                                      <span className={cfg.colorClass}>
                                        {isAr ? cfg.labelAr : cfg.labelEn}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Restock checkbox */}
                        <div className="flex items-center space-x-2 rtl:space-x-reverse pt-4 sm:pt-0">
                          <Checkbox
                            id={`restock-${item._id}`}
                            checked={currentInsp.restockApproved}
                            disabled={
                              isAlreadyRestocked ||
                              currentInsp.condition === ITEM_CONDITIONS.WORN ||
                              currentInsp.condition === ITEM_CONDITIONS.DAMAGED
                            }
                            onCheckedChange={(checked) =>
                              handleRestockChange(item._id, Boolean(checked))
                            }
                          />
                          <Label
                            htmlFor={`restock-${item._id}`}
                            className="text-xs font-medium cursor-pointer"
                          >
                            {isAr ? "الموافقة على إعادة الإدراج بالمخزون" : "Approve Inventory Restock"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inspection notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isAr ? "تقرير وملاحظات الفحص الفني (مطلوب):" : "Inspection Notes & Findings (Required):"}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isAr
                    ? "سجّل تفاصيل فحص الغلاف، سلامة القماش والملصقات، وسبب قرار الإرجاع للمخزون..."
                    : "Detail packaging integrity, fabric/tags condition, and restocking justification..."
                }
                rows={3}
                className="text-xs"
              />
              {notes.trim().length > 0 && notes.trim().length < 3 && (
                <p className="text-[11px] text-destructive">
                  {isAr ? "الملاحظات يجب ألا تقل عن 3 أحرف" : "Notes must be at least 3 characters"}
                </p>
              )}
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
              disabled={notes.trim().length < 3 || isPending}
            >
              {isPending
                ? isAr
                  ? "جاري الحفظ..."
                  : "Processing..."
                : isAr
                  ? "إتمام الفحص"
                  : "Complete Inspection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog before restocking inventory */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="size-5 text-amber-500" />
              <span>{isAr ? "تأكيد إعادة إدراج المنتجات بالمخزون" : "Confirm Inventory Restock"}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? "سيتم زيادة كمية المخزون في المستودع فورياً للقطع التي تم اعتمادها. هل تم التأكد من سلامة القطع ومطابقتها للشروط؟"
                : "Eligible items with restock approval will be immediately added back into warehouse inventory stock. Are you certain these items meet resale conditions?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {isAr ? "مراجعة الفحص" : "Review"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeInspection}
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending
                ? isAr
                  ? "جاري التحديث..."
                  : "Restocking..."
                : isAr
                  ? "تأكيد وإدراج بالمخزون"
                  : "Confirm & Restock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
