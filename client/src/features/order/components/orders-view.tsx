"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  CreditCard,
  Banknote,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  RotateCcw,
  MessageCircle,
  Sparkles,
  Calendar,
  Box,
} from "lucide-react";
import { useCartStore } from "@/src/shared/stores/cart-store";
import { OrderTrackingTimeline } from "@/shared/components/order-tracking-timeline";
import { toast } from "sonner";

interface OrderItem {
  id?: string;
  name: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: string;
}

interface OrderDisplay {
  _id?: string;
  orderNumber: string;
  createdAt?: string;
  status: string;
  pricing: {
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
  };
  paymentInfo?: {
    method: string;
    status: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    governorate: string;
    building?: string;
    apartment?: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };
  customerInfo?: {
    fullName: string;
    phone: string;
    email?: string;
  };
  items: OrderItem[];
}

const ORDER_STEPS = [
  { key: "NEW", labelAr: "تم استلام الطلب", labelEn: "Order Placed", icon: Box },
  { key: "CONFIRMED", labelAr: "تم التأكيد", labelEn: "Confirmed", icon: CheckCircle2 },
  { key: "PROCESSING", labelAr: "قيد التجهيز والتغليف", labelEn: "Processing", icon: Clock },
  { key: "SHIPPED", labelAr: "خرج للتوصيل مع المندوب", labelEn: "Out for Delivery", icon: Truck },
  { key: "DELIVERED", labelAr: "تم التوصيل بنجاح", labelEn: "Delivered", icon: Check },
];

function getStepIndex(status: string): number {
  switch (status?.toUpperCase()) {
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
    case "CANCELLED":
    case "RETURNED":
      return 0;
    default:
      return 1;
  }
}

export function OrdersView({ userName }: { userName?: string }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { addItem, setIsOpen: setCartOpen } = useCartStore();

  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history" | "search">("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search by orderNumber
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<OrderDisplay | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        let serverOrders: OrderDisplay[] = [];
        try {
          const res = await fetch("/api/customer/orders");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.data)) {
              serverOrders = data.data;
            }
          }
        } catch {}

        let localOrders: OrderDisplay[] = [];
        try {
          const stored = localStorage.getItem("mire-recent-orders");
          if (stored) {
            localOrders = JSON.parse(stored);
          }
        } catch {}

        // Combine and deduplicate
        const combined = [...localOrders];
        for (const so of serverOrders) {
          if (!combined.some((o) => o.orderNumber === so.orderNumber)) {
            combined.push(so);
          }
        }

        setOrders(combined);
        if (combined.length > 0) {
          setExpandedId(combined[0].orderNumber);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const handleCopyOrderNumber = (num: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    toast.success(isAr ? "تم نسخ رقم الطلب" : "Order number copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReorder = (order: OrderDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    for (const it of order.items) {
      addItem({
        id: it.id || `reorder-${Date.now()}`,
        title: it.name,
        color: it.color || (isAr ? "كلاسيكي" : "Classic"),
        size: it.size || "M",
        price: it.unitPrice || 850,
        image: it.image || "/products/abaya.jpg",
        quantity: it.quantity || 1,
      });
    }
    toast.success(
      isAr
        ? "تمت إضافة منتجات الطلب إلى حقيبة التسوق"
        : "Order items re-added to your bag"
    );
    setCartOpen(true);
  };

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchedOrder(null);

    // First check local orders
    const localMatch = orders.find(
      (o) => o.orderNumber.toUpperCase() === query
    );

    if (localMatch) {
      setSearchedOrder(localMatch);
      setSearchLoading(false);
      return;
    }

    // Otherwise query tracking API
    try {
      const res = await fetch(`/api/customer/orders/track/${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setSearchedOrder(data.data);
      } else {
        setSearchError(
          isAr
            ? "لم نتمكن من العثور على طلب بهذا الرقم، يرجى التأكد والمحاولة مجدداً"
            : "No order found with this tracking number"
        );
      }
    } catch {
      setSearchError(
        isAr ? "تعذر الاتصال بخدمة التتبع حالياً" : "Tracking service temporarily unavailable"
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Split into active and completed
  const activeOrders = orders.filter(
    (o) => o.status?.toUpperCase() !== "DELIVERED" && o.status?.toUpperCase() !== "CANCELLED"
  );
  const completedOrders = orders.filter(
    (o) => o.status?.toUpperCase() === "DELIVERED" || o.status?.toUpperCase() === "CANCELLED"
  );

  const displayedOrders = activeTab === "active" ? activeOrders : completedOrders;

  const renderTimeline = (status: string) => {
    const currentStep = getStepIndex(status);

    if (status?.toUpperCase() === "CANCELLED") {
      return (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>{isAr ? "تم إلغاء هذا الطلب" : "This order has been cancelled"}</span>
        </div>
      );
    }

    return (
      <div className="py-3 px-2">
        <div className="relative flex items-center justify-between">
          {/* Horizontal Track Line */}
          <div className="absolute top-4 start-4 end-4 h-0.5 bg-ds-border-muted/60 -z-0" />
          <div
            className="absolute top-4 start-4 h-0.5 bg-ds-primary transition-all duration-500 -z-0"
            style={{
              width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (ORDER_STEPS.length - 1)) * 100))}%`,
            }}
          />

          {ORDER_STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const isDone = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            const IconComponent = step.icon;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center text-center relative z-10 min-w-16 sm:min-w-20"
              >
                <div
                  className={`size-8 sm:size-9 rounded-full flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-ds-primary text-white shadow-xs"
                      : isCurrent
                      ? "bg-ds-primary text-white ring-4 ring-ds-primary/20 shadow-sm animate-pulse"
                      : "bg-ds-plain border border-ds-border-muted text-ds-text-soft"
                  }`}
                >
                  <IconComponent className="size-4" />
                </div>
                <span
                  className={`mt-2 text-[10px] sm:text-[11px] leading-tight font-medium max-w-18 sm:max-w-24 ${
                    isCurrent
                      ? "text-ds-primary font-bold"
                      : isDone
                      ? "text-ds-text-plain"
                      : "text-ds-text-soft"
                  }`}
                >
                  {isAr ? step.labelAr : step.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOrderCard = (order: OrderDisplay) => {
    const isExpanded = expandedId === order.orderNumber;
    const isOrderActive = order.status?.toUpperCase() !== "DELIVERED" && order.status?.toUpperCase() !== "CANCELLED";

    // Approximate delivery date 2-3 business days ahead
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const estDeliveryDate = new Date(orderDate);
    estDeliveryDate.setDate(orderDate.getDate() + 3);

    return (
      <div
        key={order.orderNumber}
        className="rounded-3xl border border-ds-border-muted bg-ds-elevated transition-all overflow-hidden shadow-2xs hover:border-ds-primary/30"
      >
        {/* Top Header Bar */}
        <div
          onClick={() => setExpandedId(isExpanded ? null : order.orderNumber)}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4 cursor-pointer hover:bg-ds-subtle/30 transition-colors"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-bold text-sm sm:text-base text-ds-text-plain tracking-wider">
                {order.orderNumber}
              </span>
              <button
                type="button"
                onClick={(e) => handleCopyOrderNumber(order.orderNumber, e)}
                className="text-ds-text-soft hover:text-ds-primary transition-colors p-1 rounded-md"
                title={isAr ? "نسخ رقم الطلب" : "Copy order number"}
              >
                {copiedId === order.orderNumber ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status?.toUpperCase() === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isOrderActive
                    ? "bg-ds-primary/10 text-ds-primary border border-ds-primary/20"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <span className="size-1.5 rounded-full bg-current animate-ping" />
                <span>
                  {order.status?.toUpperCase() === "DELIVERED"
                    ? isAr ? "تم التوصيل" : "Delivered"
                    : isAr ? "قيد المتابعة والتجهيز" : "Active & In Progress"}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-ds-text-soft">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>
                  {orderDate.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </span>
              <span>•</span>
              <span>
                {order.items?.length || 1} {isAr ? "قطع" : "items"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-5">
            <div className="text-start sm:text-end">
              <span className="text-[11px] text-ds-text-soft block">
                {isAr ? "إجمالي المبلغ" : "Total Amount"}
              </span>
              <span className="font-mono font-bold text-lg text-ds-primary">
                {order.pricing?.totalAmount || order.pricing?.subtotal || 0} {isAr ? "ج.م" : "EGP"}
              </span>
            </div>

            <div className="size-8 rounded-full border border-ds-border-muted flex items-center justify-center text-ds-text-soft">
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </div>
          </div>
        </div>

        {/* Live Tracking Visual Stepper */}
        <div className="p-4 sm:p-5 bg-ds-plain/40 border-t border-b border-ds-border-muted/50">
          <OrderTrackingTimeline
            orderNumber={order.orderNumber}
            status={order.status}
            createdAt={order.createdAt}
            shippingGovernorate={order.shippingAddress?.governorate}
            shippingCity={order.shippingAddress?.city}
            customerName={order.customerInfo?.fullName}
            customerPhone={order.customerInfo?.phone}
          />
        </div>

        {/* Expanded Details Body */}
        {isExpanded && (
          <div className="p-5 sm:p-6 space-y-6 animate-in fade-in duration-200">
            {/* Products List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-ds-text-plain uppercase tracking-wider block">
                {isAr ? "المنتجات المطلوبة" : "Order Items"}
              </span>
              <div className="space-y-2.5">
                {order.items?.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-ds-subtle/50 border border-ds-border-subtle text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-ds-plain border border-ds-border-subtle flex items-center justify-center text-ds-primary shrink-0">
                        <Box className="size-6 stroke-[1.5]" />
                      </div>
                      <div>
                        <p className="font-semibold text-ds-text-plain">{it.name}</p>
                        <p className="text-ds-text-soft mt-0.5">
                          {it.color ? `${it.color} • ` : ""}
                          {it.size ? `${it.size} • ` : ""}
                          x{it.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-ds-primary text-sm">
                      {it.subtotal || it.unitPrice * it.quantity} {isAr ? "ج.م" : "EGP"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Payment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delivery Address */}
              <div className="rounded-2xl border border-ds-border-muted p-4 space-y-1.5 text-xs text-ds-text-muted">
                <span className="font-semibold text-ds-text-plain flex items-center gap-1.5 mb-2">
                  <MapPin className="size-3.5 text-ds-primary" />
                  {isAr ? "عنوان التوصيل المحدد" : "Delivery Address"}
                </span>
                {order.customerInfo && (
                  <p className="font-medium text-ds-text-plain">
                    {order.customerInfo.fullName} • {order.customerInfo.phone}
                  </p>
                )}
                {order.shippingAddress && (
                  <p>
                    {order.shippingAddress.governorate}، {order.shippingAddress.city}، {order.shippingAddress.street}
                    {order.shippingAddress.building ? `، عمارة ${order.shippingAddress.building}` : ""}
                    {order.shippingAddress.apartment ? `، شقة ${order.shippingAddress.apartment}` : ""}
                    {order.shippingAddress.landmark ? ` (${order.shippingAddress.landmark})` : ""}
                  </p>
                )}
                {order.shippingAddress?.latitude && order.shippingAddress?.longitude && (
                  <div className="pt-1.5 flex items-center gap-1 font-mono text-[11px] text-ds-text-soft">
                    <span>📍 {order.shippingAddress.latitude.toFixed(4)}, {order.shippingAddress.longitude.toFixed(4)}</span>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="rounded-2xl border border-ds-border-muted p-4 space-y-2 text-xs text-ds-text-muted">
                <span className="font-semibold text-ds-text-plain flex items-center gap-1.5 mb-2">
                  <CreditCard className="size-3.5 text-ds-primary" />
                  {isAr ? "تفاصيل الدفع والتكلفة" : "Payment & Billing"}
                </span>
                <div className="flex justify-between">
                  <span>{isAr ? "طريقة الدفع:" : "Method:"}</span>
                  <span className="font-semibold text-ds-text-plain">
                    {order.paymentInfo?.method === "PAYMOB"
                      ? isAr ? "بطاقة بنكية (Paymob)" : "Card (Paymob)"
                      : isAr ? "الدفع عند الاستلام (COD)" : "Cash on Delivery (COD)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? "المجموع الفرعي:" : "Subtotal:"}</span>
                  <span className="font-mono">{order.pricing?.subtotal || 0} {isAr ? "ج.م" : "EGP"}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? "الشحن:" : "Shipping:"}</span>
                  <span className="font-mono">
                    {order.pricing?.shippingFee === 0
                      ? isAr ? "مجاني" : "Free"
                      : `${order.pricing?.shippingFee || 50} ${isAr ? "ج.م" : "EGP"}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-ds-border-muted/60 pt-2 font-bold text-sm text-ds-text-plain">
                  <span>{isAr ? "المجموع الكلي:" : "Total Amount:"}</span>
                  <span className="font-mono text-ds-primary">
                    {order.pricing?.totalAmount || 0} {isAr ? "ج.م" : "EGP"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-ds-border-muted">
              {/* WhatsApp Support button */}
              <a
                href={`https://wa.me/201012345678?text=${encodeURIComponent(
                  isAr
                    ? `مرحباً، أود الاستفسار عن حالة طلبي رقم: ${order.orderNumber}`
                    : `Hello, I'd like to check on my order: ${order.orderNumber}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <MessageCircle className="size-4" />
                <span>{isAr ? "مساعدة فورية عبر واتساب" : "WhatsApp Support"}</span>
              </a>

              {/* Re-order button */}
              <button
                type="button"
                onClick={(e) => handleReorder(order, e)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ds-plain border border-ds-border-muted hover:border-ds-primary text-xs font-semibold text-ds-text-plain hover:text-ds-primary transition-all shadow-2xs"
              >
                <RotateCcw className="size-3.5" />
                <span>{isAr ? "إعادة طلب هذه القطع" : "Re-order Items"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center py-20 text-center text-xs text-ds-text-soft">
        <Clock className="size-8 animate-spin text-ds-primary mb-3" />
        <span>{isAr ? "جاري جلب تفاصيل طلباتكِ..." : "Loading orders..."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-b border-ds-border-muted/60 pb-5">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "active"
              ? "bg-ds-primary text-white shadow-xs"
              : "bg-ds-plain text-ds-text-plain border border-ds-border-muted hover:border-ds-primary/60"
          }`}
        >
          <Truck className="size-3.5" />
          <span>{isAr ? "طلباتي الحالية" : "Active Orders"}</span>
          <span
            className={`ms-1 size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              activeTab === "active"
                ? "bg-white text-ds-primary"
                : "bg-ds-subtle text-ds-text-plain"
            }`}
          >
            {activeOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-ds-primary text-white shadow-xs"
              : "bg-ds-plain text-ds-text-plain border border-ds-border-muted hover:border-ds-primary/60"
          }`}
        >
          <CheckCircle2 className="size-3.5" />
          <span>{isAr ? "الطلبات المكتملة" : "Completed Orders"}</span>
          <span
            className={`ms-1 size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              activeTab === "history"
                ? "bg-white text-ds-primary"
                : "bg-ds-subtle text-ds-text-plain"
            }`}
          >
            {completedOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "search"
              ? "bg-ds-primary text-white shadow-xs"
              : "bg-ds-plain text-ds-text-plain border border-ds-border-muted hover:border-ds-primary/60"
          }`}
        >
          <Search className="size-3.5" />
          <span>{isAr ? "تتبع برقم الشحنة" : "Track by Number"}</span>
        </button>
      </div>

      {/* Tab: Search by Order Number */}
      {activeTab === "search" && (
        <div className="max-w-xl mx-auto space-y-6 py-4 animate-in fade-in duration-200">
          <form onSubmit={handleSearchOrder} className="space-y-3">
            <label className="block text-xs font-medium text-ds-text-plain text-center">
              {isAr
                ? "أدخلي رقم الطلب الخاص بكِ للاطلاع الفوري على حالة الشحنة ومسار التوصيل"
                : "Enter your order tracking number to see real-time shipment progress"}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="size-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-ds-text-soft" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchError("");
                  }}
                  placeholder="e.g. MIRE-2026-00001"
                  className="w-full h-12 ps-10 pe-4 rounded-2xl border border-ds-border-muted bg-ds-elevated font-mono uppercase text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-ds-primary shadow-xs"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="h-12 px-7 rounded-2xl bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {searchLoading ? <Clock className="size-4 animate-spin" /> : <Search className="size-4" />}
                <span>{isAr ? "تتبع" : "Track"}</span>
              </button>
            </div>
            {searchError && (
              <p className="text-rose-500 text-xs text-center font-medium pt-1">
                {searchError}
              </p>
            )}
          </form>

          {/* Searched Order Card */}
          {searchedOrder && (
            <div className="pt-2 animate-in fade-in duration-300">
              {renderOrderCard(searchedOrder)}
            </div>
          )}
        </div>
      )}

      {/* Tab: Active or Completed Orders */}
      {activeTab !== "search" && (
        <>
          {displayedOrders.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ds-border-muted bg-ds-elevated/40 p-12 text-center max-w-md mx-auto">
              <Package className="size-12 text-ds-text-soft stroke-[1.5]" />
              <h2 className="mt-4 font-serif text-xl font-semibold text-ds-text-plain">
                {activeTab === "active"
                  ? isAr ? "لا توجد طلبات جارية حالياً" : "No active orders right now"
                  : isAr ? "لا توجد طلبات مكتملة سابقة" : "No completed orders yet"}
              </h2>
              <p className="mt-2 text-xs text-ds-text-muted max-w-xs leading-relaxed">
                {activeTab === "active"
                  ? isAr
                    ? "عند إتمام أي طلب جديد، ستتمكنين من متابعة مراحل التجهيز والتوصيل هنا خطوة بخطوة."
                    : "When you place an order, its live preparation and shipping timeline will appear here."
                  : isAr
                  ? "جميع طلباتكِ التي يتم توصيلها بنجاح سيتم أرشفتها هنا مع الفواتير."
                  : "All orders delivered to you will be archived here."}
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ds-primary px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-ds-primary-saturated hover:shadow-md"
              >
                <span>{isAr ? "تصفحي المنتجات" : "Shop Collection"}</span>
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedOrders.map((order) => renderOrderCard(order))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
