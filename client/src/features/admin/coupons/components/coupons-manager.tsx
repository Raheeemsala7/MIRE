"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  Tag,
  Plus,
  Copy,
  Check,
  Trash2,
  Calendar,
  Sparkles,
  TicketPercent,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Switch } from "@/shared/components/ui/switch";

export interface CouponItem {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
  maxUsesPerCustomer: number;
  isActive: boolean;
  createdAt?: string;
}

interface CouponsManagerProps {
  initialCoupons: CouponItem[];
}

export function CouponsManager({ initialCoupons }: CouponsManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for creating a coupon
  const [formCode, setFormCode] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formMinOrder, setFormMinOrder] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | "">("");
  const [formUsageLimit, setFormUsageLimit] = useState<number | "">(100);
  const [formEndDate, setFormEndDate] = useState<string>(
    new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success(isAr ? "تم نسخ كود الكوبون" : "Coupon code copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const updated = !currentStatus;
    setCoupons((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isActive: updated } : c))
    );

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updated }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(
        updated
          ? isAr ? "تم تفعيل الكوبون بنجاح" : "Coupon activated"
          : isAr ? "تم تعطيل الكوبون" : "Coupon deactivated"
      );
    } catch {
      // Revert on failure
      setCoupons((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: currentStatus } : c))
      );
      toast.error(isAr ? "تعذر تحديث حالة الكوبون" : "Error toggling coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "هل أنتِ متأكدة من حذف هذا الكوبون نهائياً؟" : "Delete this coupon permanently?")) {
      return;
    }

    setCoupons((prev) => prev.filter((c) => c._id !== id));

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(isAr ? "تم حذف الكوبون بنجاح" : "Coupon deleted");
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء حذف الكوبون" : "Error deleting coupon");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      toast.error(isAr ? "يرجى إدخال كود الكوبون" : "Coupon code required");
      return;
    }

    setSubmitting(true);
    const newCouponPayload = {
      code: cleanCode,
      discountType: formDiscountType,
      discountValue: Number(formDiscountValue),
      minOrderAmount: Number(formMinOrder) || 0,
      maxDiscountAmount: formMaxDiscount ? Number(formMaxDiscount) : null,
      usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
      startDate: new Date().toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      isActive: true,
      maxUsesPerCustomer: 1,
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCouponPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create coupon");
      }

      setCoupons((prev) => [data.data, ...prev]);
      setIsDialogOpen(false);
      setFormCode("");
      toast.success(
        isAr ? `تم إنشاء الكوبون #${cleanCode} بنجاح!` : `Coupon #${cleanCode} created!`
      );
    } catch (err: any) {
      toast.error(err.message || (isAr ? "تعذر إنشاء الكوبون" : "Failed to create coupon"));
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive && new Date(c.endDate) >= new Date()).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  // Filtered List
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase());
    const isExpired = new Date(c.endDate) < new Date();

    if (filterType === "ACTIVE") return matchesSearch && c.isActive && !isExpired;
    if (filterType === "EXPIRED") return matchesSearch && isExpired;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ds-text-soft uppercase">
              {isAr ? "إجمالي الكوبونات" : "Total Coupons"}
            </span>
            <p className="font-mono text-3xl font-bold text-ds-text-plain mt-1">
              {totalCoupons}
            </p>
          </div>
          <div className="size-12 rounded-2xl bg-ds-primary/10 text-ds-primary flex items-center justify-center">
            <TicketPercent className="size-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ds-text-soft uppercase">
              {isAr ? "الكوبونات النشطة" : "Active Coupons"}
            </span>
            <p className="font-mono text-3xl font-bold text-emerald-600 mt-1">
              {activeCoupons}
            </p>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="size-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ds-text-soft uppercase">
              {isAr ? "مرات الاستخدام" : "Total Uses"}
            </span>
            <p className="font-mono text-3xl font-bold text-amber-500 mt-1">
              {totalRedemptions}
            </p>
          </div>
          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <TrendingUp className="size-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filter & New Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute start-3 top-1/2 -translate-y-1/2 text-ds-text-soft" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "البحث عن كود كوبون..." : "Search coupon code..."}
              className="ps-9 h-11 rounded-2xl border-ds-border-muted bg-ds-elevated text-xs"
            />
          </div>

          <div className="flex items-center gap-1 rounded-2xl border border-ds-border-muted bg-ds-elevated p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
                filterType === "ALL" ? "bg-ds-primary text-white" : "text-ds-text-soft hover:text-ds-text-plain"
              }`}
            >
              {isAr ? "الكل" : "All"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
                filterType === "ACTIVE" ? "bg-ds-primary text-white" : "text-ds-text-soft hover:text-ds-text-plain"
              }`}
            >
              {isAr ? "النشطة" : "Active"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("EXPIRED")}
              className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
                filterType === "EXPIRED" ? "bg-ds-primary text-white" : "text-ds-text-soft hover:text-ds-text-plain"
              }`}
            >
              {isAr ? "المنتهية" : "Expired"}
            </button>
          </div>
        </div>

        {/* Create Coupon Modal Trigger */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-5 rounded-2xl bg-ds-primary hover:bg-ds-primary/90 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm shrink-0">
              <Plus className="size-4" />
              <span>{isAr ? "إنشاء كوبون جديد" : "New Coupon"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-brand-serif">
                {isAr ? "إضافة كوبون خصم جديد" : "Create New Discount Coupon"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-ds-text-plain block mb-1">
                  {isAr ? "كود الكوبون *" : "Coupon Code *"}
                </label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER25"
                  className="font-mono uppercase font-bold tracking-wider"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ds-text-plain block mb-1">
                    {isAr ? "نوع الخصم" : "Discount Type"}
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-ds-border-muted bg-ds-elevated text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ds-primary"
                  >
                    <option value="PERCENTAGE">{isAr ? "نسبة مئوية (%)" : "Percentage (%)"}</option>
                    <option value="FIXED_AMOUNT">{isAr ? "مبلغ ثابت (ج.م)" : "Fixed Amount (EGP)"}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ds-text-plain block mb-1">
                    {isAr ? "قيمة الخصم *" : "Discount Value *"}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ds-text-plain block mb-1">
                    {isAr ? "الحد الأدنى للطلب (ج.م)" : "Min Order (EGP)"}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ds-text-plain block mb-1">
                    {isAr ? "الحد الأقصى للخصم (ج.م)" : "Max Discount (EGP)"}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder={isAr ? "بدون حد" : "No limit"}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ds-text-plain block mb-1">
                    {isAr ? "مرات الاستخدام القصوى" : "Usage Limit"}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value ? Number(e.target.value) : "")}
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ds-text-plain block mb-1">
                    {isAr ? "تاريخ الانتهاء *" : "End Date *"}
                  </label>
                  <Input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl text-xs"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-ds-primary text-white text-xs font-semibold px-5"
                >
                  {submitting ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الكوبون" : "Save Coupon")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons Table */}
      <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-ds-plain border-b border-ds-border-muted text-ds-text-soft uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6 text-start">{isAr ? "كود الكوبون" : "Code"}</th>
                <th className="py-4 px-6 text-start">{isAr ? "قيمة الخصم" : "Discount"}</th>
                <th className="py-4 px-6 text-start">{isAr ? "الحد الأدنى" : "Min Order"}</th>
                <th className="py-4 px-6 text-start">{isAr ? "مرات الاستخدام" : "Usage"}</th>
                <th className="py-4 px-6 text-start">{isAr ? "الصلاحية" : "Validity"}</th>
                <th className="py-4 px-6 text-center">{isAr ? "الحالة" : "Status"}</th>
                <th className="py-4 px-6 text-end">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border-subtle">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ds-text-soft">
                    {isAr ? "لا توجد كوبونات مطابقة للبحث" : "No coupons found"}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.endDate) < new Date();
                  const isCopied = copiedId === coupon.code;

                  return (
                    <tr
                      key={coupon._id}
                      className="hover:bg-ds-plain/50 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-ds-text-plain tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-ds-border-muted">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(coupon.code, e)}
                            className="size-7 rounded-lg flex items-center justify-center text-ds-text-soft hover:text-ds-primary hover:bg-ds-plain transition-colors cursor-pointer"
                            title={isAr ? "نسخ الكود" : "Copy code"}
                          >
                            {isCopied ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-6 font-semibold">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-mono">
                          {coupon.discountType === "PERCENTAGE" ? (
                            <>
                              <span>{coupon.discountValue}%</span>
                              <span className="text-[10px] text-ds-text-soft">
                                {coupon.maxDiscountAmount ? `(أقصى ${coupon.maxDiscountAmount} ج.م)` : ""}
                              </span>
                            </>
                          ) : (
                            <span>{coupon.discountValue} ج.م</span>
                          )}
                        </span>
                      </td>

                      {/* Min Order */}
                      <td className="py-4 px-6 text-ds-text-muted font-mono">
                        {coupon.minOrderAmount > 0 ? (
                          `${coupon.minOrderAmount} ج.م`
                        ) : (
                          <span className="text-ds-text-soft">{isAr ? "بدون حد" : "No min"}</span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-6 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ds-text-plain">
                            {coupon.usedCount || 0}
                          </span>
                          <span className="text-ds-text-soft">
                            / {coupon.usageLimit ? coupon.usageLimit : "∞"}
                          </span>
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="py-4 px-6 text-ds-text-muted">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="size-3.5 text-ds-text-soft" />
                          <span>
                            {new Date(coupon.endDate).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={coupon.isActive && !isExpired}
                            disabled={isExpired}
                            onCheckedChange={() => handleToggleStatus(coupon._id, coupon.isActive)}
                          />
                          <span
                            className={`text-[11px] font-semibold ${
                              isExpired
                                ? "text-rose-500"
                                : coupon.isActive
                                ? "text-emerald-600"
                                : "text-ds-text-soft"
                            }`}
                          >
                            {isExpired
                              ? isAr ? "منتهي" : "Expired"
                              : coupon.isActive
                              ? isAr ? "نشط" : "Active"
                              : isAr ? "معطل" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="py-4 px-6 text-end">
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon._id)}
                          className="size-8 rounded-xl flex items-center justify-center text-ds-text-soft hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer inline-flex"
                          title={isAr ? "حذف الكوبون" : "Delete coupon"}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
