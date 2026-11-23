"use client";

import React, { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Check,
  XCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Calendar,
  Box,
  FileText,
  MessageCircle,
  AlertCircle,
  Layers,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { toast } from "sonner";
import {
  type OrderDoc,
  type OrderStatus,
  ORDER_STATUS_CONFIG,
} from "../types/order-admin.types";
import { useUpdateOrderStatus } from "../hooks/use-update-order-status";

interface OrderDetailsViewProps {
  order: OrderDoc;
}

const LIFECYCLE_STEPS: Array<{
  status: OrderStatus;
  labelAr: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { status: "NEW", labelAr: "استلام الطلب", labelEn: "Order Placed", icon: Box },
  { status: "CONFIRMED", labelAr: "تم التأكيد", labelEn: "Confirmed", icon: CheckCircle2 },
  { status: "PROCESSING", labelAr: "تم التجهيز والتغليف", labelEn: "Processing", icon: Clock },
  { status: "SHIPPED", labelAr: "تم الشحن / للتوصيل", labelEn: "Out for Delivery", icon: Truck },
  { status: "DELIVERED", labelAr: "تم التوصيل بنجاح", labelEn: "Delivered", icon: Check },
];

function getStepNumber(status: OrderStatus): number {
  switch (status) {
    case "NEW":
      return 1;
    case "CONFIRMED":
      return 2;
    case "PROCESSING":
    case "READY_TO_SHIP":
      return 3;
    case "SHIPPED":
      return 4;
    case "DELIVERED":
      return 5;
    default:
      return 1;
  }
}

export function OrderDetailsView({ order: initialOrder }: OrderDetailsViewProps) {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

  const [order, setOrder] = useState<OrderDoc>(initialOrder);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [reason, setReason] = useState("");

  const currentStep = getStepNumber(order.status);
  const isCancelled = order.status === "CANCELLED";

  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = () => {
    if (selectedStatus === order.status) {
      toast.info(isAr ? "الطلب بالفعل في هذه الحالة" : "Order is already in this status");
      return;
    }

    const note =
      reason.trim() ||
      (isAr
        ? `تحديث الحالة إلى ${ORDER_STATUS_CONFIG[selectedStatus]?.labelAr}`
        : `Status updated to ${selectedStatus}`);

    updateStatusMutation.mutate(
      {
        orderId: order._id,
        status: selectedStatus,
        reason: note,
      },
      {
        onSuccess: () => {
          const updatedHistory = [
            ...(order.statusHistory || []),
            {
              status: selectedStatus,
              reason: note,
              timestamp: new Date().toISOString(),
              changedBy: { name: "الإدارة" },
            },
          ];

          setOrder((prev) => ({
            ...prev,
            status: selectedStatus,
            paymentInfo: {
              ...prev.paymentInfo,
              status:
                selectedStatus === "DELIVERED" && prev.paymentInfo.method === "COD"
                  ? "PAID"
                  : prev.paymentInfo.status,
            },
            statusHistory: updatedHistory,
          }));

          setReason("");
          router.refresh();
        },
      }
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status] || {
      labelAr: status,
      labelEn: status,
      badgeClass: "border-border bg-muted text-muted-foreground",
      dotColor: "bg-muted-foreground",
    };

    return (
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${config.badgeClass}`}
      >
        <span className={`size-1.5 rounded-full ${config.dotColor}`} />
        <span>{isAr ? config.labelAr : config.labelEn}</span>
      </Badge>
    );
  };

  // Google Maps URL
  const googleMapsUrl =
    order.shippingAddress?.latitude && order.shippingAddress?.longitude
      ? `https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${order.shippingAddress?.street || ""}, ${order.shippingAddress?.city || ""}, ${
            order.shippingAddress?.governorate || ""
          }, Egypt`
        )}`;

  // WhatsApp clean link
  const cleanPhone = order.customerInfo?.phone?.replace(/\D/g, "") || "";
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 px-3 text-xs gap-1.5 border-border/60 hover:bg-accent"
          >
            <Link href="/admin/orders">
              <ArrowLeft className="size-4 rtl:rotate-180" />
              <span>{isAr ? "العودة للطلبات" : "Back to Orders"}</span>
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-mono text-xl sm:text-2xl font-bold text-foreground">
                #{order.orderNumber}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>
                {isAr ? "تاريخ الطلب: " : "Placed on: "}
                {new Date(order.createdAt).toLocaleString(
                  isAr ? "ar-EG-u-nu-latn" : "en-US",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Customer Quick Contact Actions */}
        <div className="flex items-center gap-2">
          {cleanPhone && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 px-3 text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-3.5" />
                <span>{isAr ? "مراسلة واتساب" : "WhatsApp"}</span>
              </a>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 px-3 text-xs gap-1.5 border-border/60"
          >
            <a href={`tel:${order.customerInfo?.phone}`}>
              <Phone className="size-3.5" />
              <span>{isAr ? "اتصال هاتفي" : "Call Customer"}</span>
            </a>
          </Button>

          {order.status === "DELIVERED" && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 px-3 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Link href={`/admin/returns/new?orderId=${order._id}`}>
                <RotateCcw className="size-3.5" />
                <span>{isAr ? "إنشاء طلب إرجاع" : "Create Return"}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status Lifecycle & Quick Action Card */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>{isAr ? "مسار ومراحل تجهيز الطلب" : "Order Lifecycle & Status Management"}</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "تغيير حالة الطلب الحالية وإشعار العميل وتحديث سجل العمليات"
                  : "Transition order state across fulfillment milestones"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-3 space-y-6">
          {/* Progress Visualizer */}
          {!isCancelled ? (
            <div className="relative py-2">
              <div className="grid grid-cols-5 gap-2 text-center">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isDone = currentStep >= stepNum;
                  const isCurrent = currentStep === stepNum;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.status} className="flex flex-col items-center gap-2">
                      <div
                        className={`flex size-9 sm:size-11 items-center justify-center rounded-2xl transition-all ${
                          isDone
                            ? "bg-primary text-primary-foreground shadow-xs ring-4 ring-primary/10"
                            : "bg-muted text-muted-foreground/60"
                        }`}
                      >
                        <StepIcon className="size-4 sm:size-5" />
                      </div>
                      <span
                        className={`text-[11px] sm:text-xs font-medium leading-tight max-w-[100px] ${
                          isCurrent
                            ? "text-primary font-bold"
                            : isDone
                            ? "text-foreground"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {isAr ? step.labelAr : step.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{isAr ? "تم إلغاء هذا الطلب وإعادة إدراج المنتجات في المخزون" : "This order has been cancelled"}</span>
            </div>
          )}

          <Separator className="bg-border/60" />

          {/* Status Change Form */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {isAr ? "تحديد الحالة الجديدة:" : "New Order Status:"}
              </label>
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val as OrderStatus)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">
                    {ORDER_STATUS_CONFIG.NEW.labelAr} (استلام الطلب)
                  </SelectItem>
                  <SelectItem value="CONFIRMED">
                    {ORDER_STATUS_CONFIG.CONFIRMED.labelAr} (تأكيد الطلب)
                  </SelectItem>
                  <SelectItem value="PROCESSING">
                    {ORDER_STATUS_CONFIG.PROCESSING.labelAr} (تم التجهيز والتغليف)
                  </SelectItem>
                  <SelectItem value="READY_TO_SHIP">
                    {ORDER_STATUS_CONFIG.READY_TO_SHIP.labelAr} (جاهز لخروج الشحنة)
                  </SelectItem>
                  <SelectItem value="SHIPPED">
                    {ORDER_STATUS_CONFIG.SHIPPED.labelAr} (خرج للتوصيل مع المندوب)
                  </SelectItem>
                  <SelectItem value="DELIVERED">
                    {ORDER_STATUS_CONFIG.DELIVERED.labelAr} (تم التوصيل للعميلة بنجاح)
                  </SelectItem>
                  <SelectItem value="CUSTOMER_NOT_RESPONDING">
                    {ORDER_STATUS_CONFIG.CUSTOMER_NOT_RESPONDING.labelAr}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {ORDER_STATUS_CONFIG.CANCELLED.labelAr}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {isAr ? "ملاحظة أو سبب التعديل (اختياري):" : "Reason / Note (optional):"}
              </label>
              <Input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: تم التغليف بنجاح وجاهز للاستلام بواسطة شركة الشحن..."
                    : "e.g. Packaged and handed to courier..."
                }
                className="h-10 text-xs rounded-xl border-border/60"
              />
            </div>

            <div className="md:col-span-3">
              <Button
                type="button"
                disabled={updateStatusMutation.isPending}
                onClick={handleUpdateStatus}
                className="w-full h-10 text-xs font-medium rounded-xl gap-2 shadow-xs cursor-pointer"
              >
                <Check className="size-4" />
                <span>{isAr ? "حفظ وتحديث الحالة" : "Save Status"}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid: Left (Customer & Shipping) | Right (Items & Financials) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer + Shipping + Delivery Map */}
        <div className="lg:col-span-5 space-y-6">
          {/* Customer Card */}
          <Card className="rounded-2xl border border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <span>{isAr ? "بيانات العميلة" : "Customer Information"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{isAr ? "الاسم:" : "Name:"}</span>
                <span className="font-semibold text-foreground">
                  {order.customerInfo?.fullName || "Guest Customer"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{isAr ? "رقم الهاتف:" : "Phone:"}</span>
                <a
                  href={`tel:${order.customerInfo?.phone}`}
                  className="font-mono text-primary hover:underline flex items-center gap-1"
                >
                  <Phone className="size-3" />
                  <span>{order.customerInfo?.phone}</span>
                </a>
              </div>
              {order.customerInfo?.email && (
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>
                  <span className="text-foreground">{order.customerInfo.email}</span>
                </div>
              )}
              {order.orderNotes && (
                <div className="pt-2">
                  <span className="text-muted-foreground block mb-1">
                    {isAr ? "ملاحظات العميلة للتوصيل:" : "Customer Notes:"}
                  </span>
                  <p className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-foreground italic">
                    "{order.orderNotes}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Destination & Map Coordinates */}
          <Card className="rounded-2xl border border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>{isAr ? "عنوان الشحن وموقع التوصيل" : "Shipping Destination"}</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 px-2 text-[11px] gap-1 border-border/60"
              >
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <span>{isAr ? "خرائط جوجل" : "Google Maps"}</span>
                  <ExternalLink className="size-3 opacity-70" />
                </a>
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-3 text-xs">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1.5">
                <p className="font-semibold text-foreground">
                  {order.shippingAddress?.city}، {order.shippingAddress?.governorate}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingAddress?.street}
                  {order.shippingAddress?.building ? `، ${order.shippingAddress.building}` : ""}
                  {order.shippingAddress?.apartment ? `، ${order.shippingAddress.apartment}` : ""}
                </p>
                {order.shippingAddress?.landmark && (
                  <p className="text-[11px] text-primary">
                    📍 {isAr ? "علامة مميزة: " : "Landmark: "}
                    {order.shippingAddress.landmark}
                  </p>
                )}
                {order.shippingAddress?.latitude && order.shippingAddress?.longitude && (
                  <p className="font-mono text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                    GPS: {order.shippingAddress.latitude.toFixed(5)},{" "}
                    {order.shippingAddress.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status History Audit Log */}
          <Card className="rounded-2xl border border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>{isAr ? "سجل تتبع الحالات والعمليات" : "Status History Log"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="space-y-3">
                {(order.statusHistory || []).map((entry, idx) => {
                  let dateStr = "";
                  try {
                    dateStr = new Date(entry.timestamp).toLocaleString(
                      isAr ? "ar-EG-u-nu-latn" : "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );
                  } catch {
                    dateStr = "";
                  }

                  const config = ORDER_STATUS_CONFIG[entry.status as OrderStatus];

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 text-xs border-s-2 border-primary/40 ps-3 py-1"
                    >
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {isAr ? config?.labelAr || entry.status : config?.labelEn || entry.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {dateStr}
                          </span>
                        </div>
                        {entry.reason && (
                          <p className="text-[11px] text-muted-foreground leading-normal">
                            {entry.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ordered Items + Financial Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Ordered Items Table */}
          <Card className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>
                  {isAr ? "المنتجات المطلوبة" : "Ordered Items"} ({order.items?.length || 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {(order.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 sm:p-5 text-xs hover:bg-muted/10 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                        <span>
                          {isAr ? "اللون: " : "Color: "}
                          <span className="text-foreground font-medium">{item.color}</span>
                        </span>
                        <span>•</span>
                        <span>
                          {isAr ? "المقاس: " : "Size: "}
                          <span className="text-foreground font-medium">{item.size}</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono">{item.sku}</span>
                      </div>
                    </div>

                    <div className="text-end space-y-0.5 shrink-0">
                      <p className="font-mono font-bold text-sm text-foreground">
                        {item.subtotal?.toLocaleString()} {currency}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.unitPrice?.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Financial Breakdown */}
          <Card className="rounded-2xl border border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                <span>{isAr ? "الملخص المالي وطريقة الدفع" : "Financial Summary"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{isAr ? "المجموع الفرعي:" : "Subtotal:"}</span>
                <span className="font-mono text-foreground">
                  {order.pricing?.subtotal?.toLocaleString()} {currency}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">{isAr ? "رسوم الشحن:" : "Shipping Fee:"}</span>
                <span className="font-mono text-foreground">
                  {order.pricing?.shippingFee === 0 ? (
                    <span className="text-emerald-600 font-semibold">
                      {isAr ? "مجاناً" : "Free"}
                    </span>
                  ) : (
                    `${order.pricing?.shippingFee} ${currency}`
                  )}
                </span>
              </div>

              {Boolean(order.pricing?.couponDiscount) && (
                <div className="flex items-center justify-between py-1 border-b border-border/40 text-emerald-600">
                  <span>{isAr ? "خصم الكوبون:" : "Coupon Discount:"}</span>
                  <span className="font-mono">
                    -{order.pricing.couponDiscount} {currency}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-border/60 text-sm font-bold">
                <span className="text-foreground">{isAr ? "إجمالي الطلب:" : "Total Amount:"}</span>
                <span className="font-mono text-primary text-base">
                  {order.pricing?.totalAmount?.toLocaleString()} {currency}
                </span>
              </div>

              {/* Payment Status Bar */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {order.paymentInfo?.method === "COD" ? (
                    <Banknote className="size-4 text-primary" />
                  ) : (
                    <CreditCard className="size-4 text-primary" />
                  )}
                  <span className="font-semibold text-foreground">
                    {order.paymentInfo?.method === "COD"
                      ? isAr
                        ? "الدفع عند الاستلام (COD)"
                        : "Cash on Delivery"
                      : isAr
                      ? "دفع إلكتروني (Paymob / بطاقة)"
                      : "Card / Paymob"}
                  </span>
                </div>

                <Badge
                  variant={order.paymentInfo?.status === "PAID" ? "default" : "secondary"}
                  className="font-mono text-[10px]"
                >
                  {order.paymentInfo?.status === "PAID"
                    ? isAr
                      ? "تم الدفع"
                      : "PAID"
                    : isAr
                    ? "معلق (عند الاستلام)"
                    : "PENDING"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
