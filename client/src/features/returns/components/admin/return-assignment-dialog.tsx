"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { UserCheck, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { ReturnDoc } from "../../types/return.types";
import { useAssignReturn } from "../../hooks/use-assign-return";
import { fetchEmployees } from "@/features/employees/services/employees.service";

interface ReturnAssignmentDialogProps {
  returnDoc: ReturnDoc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale?: string;
}

export function ReturnAssignmentDialog({
  returnDoc,
  open,
  onOpenChange,
  locale = "en",
}: ReturnAssignmentDialogProps) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const currentAssigneeId =
    typeof returnDoc.assignedEmployee === "object" && returnDoc.assignedEmployee !== null
      ? returnDoc.assignedEmployee._id
      : typeof returnDoc.assignedEmployee === "string"
        ? returnDoc.assignedEmployee
        : "";

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentAssigneeId);
  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setSelectedEmployeeId(currentAssigneeId);
    }
  }

  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["admin-employees-assignment-list"],
    queryFn: () => fetchEmployees({ limit: 100, isActive: "true" }),
    enabled: open,
    staleTime: 1000 * 60,
  });

  const employees = employeesData?.data || [];

  const { mutate: assign, isPending } = useAssignReturn(() => {
    onOpenChange(false);
  });

  function handleSubmit() {
    if (!selectedEmployeeId) return;
    assign({
      id: returnDoc._id,
      payload: { employeeId: selectedEmployeeId },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-4 text-primary" />
            <span>{t("return-assign-action") || "Assign Return to Staff"}</span>
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? `تعيين موظف مسؤول عن متابعة وفحص طلب الإرجاع #${returnDoc.returnNumber}`
              : `Assign an employee to handle return #${returnDoc.returnNumber}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Assignee Information */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
            <span className="text-muted-foreground">
              {isAr ? "الموظف المعين حالياً: " : "Current Assignee: "}
            </span>
            <span className="font-semibold text-foreground">
              {typeof returnDoc.assignedEmployee === "object" && returnDoc.assignedEmployee !== null
                ? `${returnDoc.assignedEmployee.name} (${returnDoc.assignedEmployee.role})`
                : isAr
                  ? "غير معين"
                  : "Unassigned"}
            </span>
          </div>

          {/* Employee Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {isAr ? "اختيار الموظف المسؤول:" : "Select Responsible Staff Member:"}
            </Label>
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
              disabled={isLoadingEmployees}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue
                  placeholder={
                    isLoadingEmployees
                      ? isAr
                        ? "جاري تحميل قائمة الموظفين..."
                        : "Loading staff list..."
                      : isAr
                        ? "اختيار موظف..."
                        : "Select staff..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    <div className="flex items-center gap-2">
                      <Shield className="size-3 text-muted-foreground" />
                      <span>{emp.name}</span>
                      <span className="text-muted-foreground text-[11px]">
                        ({emp.role.replace("_", " ")})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={!selectedEmployeeId || isPending || isLoadingEmployees}
          >
            {isPending
              ? isAr
                ? "جاري التعيين..."
                : "Assigning..."
              : isAr
                ? "حفظ التعيين"
                : "Confirm Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
