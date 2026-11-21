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
} from "lucide-react";

interface OrderItem {
  name: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
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
    latitude?: number;
    longitude?: number;
  };
  customerInfo?: {
    fullName: string;
    phone: string;
  };
  items: OrderItem[];
}

export function OrdersView({ userName }: { userName?: string }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

        // Deduplicate by orderNumber
        const combined = [...localOrders];
        for (const so of serverOrders) {
          if (!combined.some((o) => o.orderNumber === so.orderNumber)) {
            combined.push(so);
          }
        }

        setOrders(combined);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return {
          label: isAr ? "تم التوصيل" : "Delivered",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40",
          icon: <CheckCircle2 className="size-3.5" />,
        };
      case "SHIPPED":
        return {
          label: isAr ? "جاري الشحن" : "Shipped",
          className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40",
          icon: <Truck className="size-3.5" />,
        };
      case "CANCELLED":
        return {
          label: isAr ? "ملغي" : "Cancelled",
          className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40",
          icon: null,
        };
      default:
        return {
          label: isAr ? "قيد التجهيز" : "Processing",
          className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40",
          icon: <Clock className="size-3.5" />,
        };
    }
  };

  if (loading) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center py-16 text-center text-xs text-ds-text-soft">
        <Clock className="size-6 animate-spin text-ds-primary mb-3" />
        <span>{isAr ? "جاري تحميل الطلبات..." : "Loading orders..."}</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ds-border-muted bg-ds-elevated/40 p-12 text-center">
        <Package className="size-12 text-ds-text-soft" aria-hidden="true" />
        <h2 className="mt-4 font-brand-serif text-2xl text-ds-text-plain">
          {isAr ? "لا توجد طلبات سابقة بعد" : "No orders yet"}
        </h2>
        <p className="mt-2 max-w-sm text-xs text-ds-text-muted">
          {isAr
            ? "عند إتمام أي طلب، ستظهر تفاصيله وموقعه المحدد وحالة الشحن هنا فوراً."
            : "When you place an order, its details and shipment tracking will appear here."}
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ds-primary px-8 py-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-ds-primary-saturated hover:shadow-md"
        >
          <span>{isAr ? "ابدأي التسوق الآن" : "Start Shopping"}</span>
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {orders.map((order) => {
        const badge = getStatusBadge(order.status);
        const isExpanded = expandedId === order.orderNumber;

        return (
          <div
            key={order.orderNumber}
            className="rounded-3xl border border-ds-border-muted bg-ds-elevated transition-all overflow-hidden"
          >
            {/* Header / Summary Bar */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : order.orderNumber)}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4 cursor-pointer hover:bg-ds-subtle/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-sm text-ds-text-plain">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                </div>
                <p className="text-xs text-ds-text-soft">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString(
                        isAr ? "ar-EG" : "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : isAr ? "حديثاً" : "Recently"}
                  {order.items?.length ? ` • ${order.items.length} ${isAr ? "منتجات" : "items"}` : ""}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-start sm:text-end">
                  <span className="text-[11px] text-ds-text-soft">
                    {isAr ? "الإجمالي" : "Total"}
                  </span>
                  <p className="font-mono font-bold text-base text-ds-primary">
                    {order.pricing?.totalAmount || order.pricing?.subtotal || 0} {isAr ? "ج.م" : "EGP"}
                  </p>
                </div>
                <button
                  type="button"
                  className="size-8 rounded-full flex items-center justify-center hover:bg-ds-border-muted/40 text-ds-text-soft"
                >
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="p-5 sm:p-6 border-t border-ds-border-muted bg-ds-plain/50 space-y-5 animate-in fade-in duration-200">
                {/* Items */}
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-ds-text-plain uppercase tracking-wider">
                    {isAr ? "تفاصيل المنتجات" : "Order Items"}
                  </span>
                  <div className="space-y-2">
                    {order.items?.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-ds-elevated p-3 border border-ds-border-subtle text-xs"
                      >
                        <div>
                          <p className="font-semibold text-ds-text-plain">{it.name}</p>
                          <p className="text-ds-text-soft mt-0.5">
                            {it.color ? `${it.color} • ` : ""}
                            {it.size ? `${it.size} • ` : ""}
                            x{it.quantity}
                          </p>
                        </div>
                        <span className="font-mono font-medium text-ds-primary">
                          {it.subtotal || it.unitPrice * it.quantity} {isAr ? "ج.م" : "EGP"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address & Map indicator */}
                {order.shippingAddress && (
                  <div>
                    <span className="text-xs font-semibold text-ds-text-plain uppercase tracking-wider">
                      {isAr ? "عنوان التوصيل المحدد" : "Shipping Destination"}
                    </span>
                    <div className="mt-1.5 rounded-xl bg-ds-elevated p-3.5 border border-ds-border-subtle text-xs text-ds-text-muted space-y-1">
                      {order.customerInfo && (
                        <p className="font-semibold text-ds-text-plain">
                          {order.customerInfo.fullName} • {order.customerInfo.phone}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-ds-primary shrink-0" />
                        <span>
                          {order.shippingAddress.governorate}، {order.shippingAddress.city}، {order.shippingAddress.street}
                        </span>
                      </p>
                      {order.shippingAddress.latitude && order.shippingAddress.longitude && (
                        <p className="font-mono text-[11px] text-ds-text-soft pt-0.5">
                          📍 {order.shippingAddress.latitude.toFixed(4)}, {order.shippingAddress.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
