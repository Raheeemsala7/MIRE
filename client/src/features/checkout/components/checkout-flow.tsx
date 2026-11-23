"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/src/i18n/navigation";
import { toast } from "sonner";
import {
  MapPin,
  CreditCard,
  Banknote,
  Check,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Loader2,
  PackageCheck,
  Clock,
  Sparkles,
  ChevronRight,
  Phone,
  Tag,
  Smartphone,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "@/src/shared/stores/cart-store";
import { useAddressStore, AddressList } from "@/src/features/address";
import { CouponInput } from "@/src/shared/components/coupon-input";
import { OrderTrackingTimeline } from "@/src/shared/components/order-tracking-timeline";
import { useCreateOrder } from "../hooks/use-create-order";
import type { PaymentMethod, PlacedOrder } from "../types/checkout";

export function CheckoutFlow() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams?.get("orderNumber");
  const paymentParam = searchParams?.get("payment");

  const { items, getTotalPrice, getDiscountAmount, coupon, clearCart, addItem } = useCartStore();
  const { getSelectedAddress } = useAddressStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("DAFTAR_CASH");
  const [orderNotes, setOrderNotes] = useState("");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  const createOrderMutation = useCreateOrder(
    (createdOrder) => {
      // Save order to sessionStorage for in-tab confirmation (isolated from other users)
      try {
        localStorage.removeItem("mire-recent-orders");
        const stored = sessionStorage.getItem("mire-recent-orders");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(createdOrder);
        sessionStorage.setItem("mire-recent-orders", JSON.stringify(list.slice(0, 5)));
      } catch {}

      clearCart();
      setPlacedOrder(createdOrder);

      // If online payment gateway returned a checkout URL (DaftarCash / Paymob), redirect to it!
      if (createdOrder.checkoutUrl) {
        toast.success(
          isAr
            ? `تم تسجيل الطلب! جاري تحويلك لصفحة الدفع الإلكتروني وسداد الفاتورة...`
            : `Order placed! Redirecting to payment checkout...`
        );
        setTimeout(() => {
          if (createdOrder.checkoutUrl) {
            window.location.href = createdOrder.checkoutUrl;
          }
        }, 1200);
        return;
      }

      toast.success(
        isAr
          ? `تم إنشاء الطلب بنجاح! رقم الطلب: ${createdOrder.orderNumber}`
          : `Order placed successfully! #${createdOrder.orderNumber}`
      );
    },
    (err) => {
      toast.error(err.message || (isAr ? "حدث خطأ أثناء إنشاء الطلب" : "Error placing order"));
    }
  );

  // If user has items in cart, ensure placedOrder is cleared and stepper is reset to 1
  useEffect(() => {
    if (items.length > 0) {
      setPlacedOrder(null);
    }
  }, [items.length]);

  // Handle return from external payment gateway (e.g. DaftarCash)
  useEffect(() => {
    if (orderNumberParam && items.length === 0) {
      try {
        const stored = sessionStorage.getItem("mire-recent-orders") || localStorage.getItem("mire-recent-orders");
        localStorage.removeItem("mire-recent-orders");
        const list = stored ? JSON.parse(stored) : [];
        const found = list.find((o: PlacedOrder) => o.orderNumber === orderNumberParam);
        if (found) {
          setPlacedOrder(found);
        } else {
          setPlacedOrder({
            orderNumber: orderNumberParam,
            customerInfo: { fullName: "عميل ميري", phone: "" },
            shippingAddress: { street: "", city: "", governorate: "مصر" },
            paymentInfo: {
              method: "DAFTAR_CASH",
              status: paymentParam === "success" ? "PAID" : "PENDING",
            },
            pricing: { subtotal: 0, shippingFee: 0, totalAmount: 0 },
            items: [],
            status: paymentParam === "success" ? "CONFIRMED" : "NEW",
          });
        }
      } catch {}
    }
  }, [orderNumberParam, paymentParam, items.length]);

  const selectedAddress = getSelectedAddress();
  const subtotal = getTotalPrice();
  const discountAmount = getDiscountAmount();
  const freeShippingThreshold = 1500;
  const shippingFee = (subtotal - discountAmount) >= freeShippingThreshold || subtotal === 0 ? 0 : 50;
  const totalAmount = Math.max(0, subtotal - discountAmount) + shippingFee;

  // Render Order Confirmation View ONLY if an order was placed AND cart is currently empty
  if (placedOrder && items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl text-center py-10 px-4 animate-in fade-in duration-300 space-y-6">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
          <PackageCheck className="size-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 mb-2">
            <Sparkles className="size-3.5" />
            {isAr ? "تم تنفيذ طلبك بنجاح!" : "Order Successfully Placed!"}
          </span>

          <h1 className="font-brand-serif text-2xl sm:text-3xl font-semibold text-ds-text-plain">
            {isAr ? "شكراً لتسوقكِ مع ميري" : "Thank you for shopping with MIRÉ"}
          </h1>

          {paymentParam === "success" && (
            <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-500/30 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>
                {isAr
                  ? "تم تأكيد عملية التحويل عبر دفتر كاش بنجاح! طلبك مؤكد وقيد التجهيز."
                  : "Payment verified via DaftarCash! Your order is confirmed."}
              </span>
            </div>
          )}
        </div>

        {/* Live Order Tracking Timeline */}
        <OrderTrackingTimeline
          orderNumber={placedOrder.orderNumber}
          status="NEW"
          createdAt={new Date()}
          customerName={placedOrder.customerInfo?.fullName || selectedAddress?.fullName}
          customerPhone={placedOrder.customerInfo?.phone || selectedAddress?.phone}
          shippingGovernorate={placedOrder.shippingAddress?.governorate || selectedAddress?.governorate}
          shippingCity={placedOrder.shippingAddress?.city || selectedAddress?.city}
        />

        {/* Online Payment (DaftarCash / Gateway) Pending Invoice Card */}
        {placedOrder.checkoutUrl && (
          <div className="p-5 rounded-3xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-start space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Smartphone className="size-4" />
                {isAr ? "فاتورة سداد المحافظ الإلكترونية وإنستاباي" : "Mobile Wallet & InstaPay Invoice"}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-medium">
                {isAr ? "في انتظار التحويل" : "Awaiting Transfer"}
              </span>
            </div>
            <p className="text-xs text-ds-text-muted leading-relaxed">
              {isAr
                ? "إذا لم يتم توجيهك تلقائياً لصفحة الدفع، يمكنك الضغط على الزر التالي لإتمام التحويل وتأكيد طلبك فوراً:"
                : "If not automatically redirected, click below to open the checkout page and complete your transfer:"}
            </p>
            <a
              href={placedOrder.checkoutUrl}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider transition-all shadow-sm"
            >
              <CreditCard className="size-4" />
              <span>{isAr ? "سداد الفاتورة عبر دفتر كاش الآن" : "Pay via DaftarCash Now"}</span>
            </a>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/orders"
            onClick={() => setPlacedOrder(null)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-all shadow-sm hover:shadow-md"
          >
            {isAr ? "عرض ومتابعة طلباتي" : "Track My Orders"}
          </Link>
          <Link
            href="/products"
            onClick={() => setPlacedOrder(null)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-ds-border-muted bg-white hover:bg-ds-subtle text-ds-text-plain text-xs font-semibold tracking-wider transition-all"
          >
            {isAr ? "متابعة التسوق" : "Continue Shopping"}
          </Link>
        </div>
      </div>
    );
  }

  // If cart is empty and no order placed
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg text-center py-20 px-4">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-ds-subtle text-ds-text-soft mb-5">
          <ShoppingBag className="size-8" />
        </div>
        <h2 className="font-brand-serif text-2xl font-semibold text-ds-text-plain">
          {isAr ? "حقيبة التسوق فارغة" : "Your Shopping Bag is Empty"}
        </h2>
        <p className="mt-2 text-xs text-ds-text-muted">
          {isAr
            ? "أضيفي منتجاتك المفضلة إلى الحقيبة قبل إتمام الطلب"
            : "Add items to your bag before proceeding to checkout"}
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-all shadow-sm"
        >
          <span>{isAr ? "تصفح التشكيلة" : "Browse Collections"}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>

        {/* Quick test item helper */}
        <div className="mt-6 pt-6 border-t border-dashed border-ds-border-muted/80 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => {
              addItem({
                id: "pleated-skirt-test",
                title: isAr ? "جيبة بليسيه ماكسي (قطعة تجربة)" : "Pleated Maxi Skirt (Test Item)",
                price: 850,
                color: isAr ? "سماوي" : "Sky Blue",
                size: "M",
                image: "/products/skirt/sky-blue.png",
              });
              toast.success(
                isAr
                  ? "تمت إضافة قطعة تجريبية للسلة! يمكنكِ الآن اختبار الدفع مباشرة"
                  : "Added test item to bag! You can now test checkout"
              );
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="size-4 text-emerald-600 shrink-0" />
            <span>
              {isAr
                ? "+ إضافة قطعة تجريبية إلى السلة لتجربة الدفع السريع"
                : "+ Add test item for quick payment test"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast.error(isAr ? "يرجى تحديد أو إضافة عنوان التوصيل أولاً" : "Please select or add a shipping address");
      setStep(1);
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const returnUrl = `${origin}/${locale}/checkout`;

    createOrderMutation.mutate({
      customerInfo: {
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone,
        email: "",
      },
      shippingAddress: {
        street: selectedAddress.street,
        building: selectedAddress.building || "",
        apartment: selectedAddress.apartment || "",
        city: selectedAddress.city,
        governorate: selectedAddress.governorate,
        landmark: selectedAddress.landmark || "",
        country: "Egypt",
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
      },
      paymentMethod,
      orderNotes,
      origin,
      returnUrl,
      couponCode: coupon?.code,
      couponDiscount: discountAmount,
      pricing: {
        subtotal,
        couponDiscount: discountAmount,
        shippingFee,
        totalAmount,
      },
      items: items.map((it) => ({
        productId: it.id,
        id: it.id,
        title: it.title,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        price: it.price,
      })),
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
      {/* ─── Main Stepper Column ─── */}
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between rounded-2xl border border-ds-border-muted bg-ds-elevated p-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
              step >= 1 ? "text-ds-primary" : "text-ds-text-soft"
            }`}
          >
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[11px] ${
                step > 1
                  ? "bg-ds-primary text-white"
                  : step === 1
                  ? "border-2 border-ds-primary text-ds-primary"
                  : "border border-ds-border-muted text-ds-text-soft"
              }`}
            >
              {step > 1 ? <Check className="size-3 stroke-[3]" /> : "1"}
            </span>
            <span>{isAr ? "العنوان والخريطة" : "Address & Map"}</span>
          </button>

          <ChevronRight className="size-4 text-ds-border-muted rtl:rotate-180" />

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
              step >= 2 ? "text-ds-primary" : "text-ds-text-soft"
            }`}
          >
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[11px] ${
                step > 2
                  ? "bg-ds-primary text-white"
                  : step === 2
                  ? "border-2 border-ds-primary text-ds-primary"
                  : "border border-ds-border-muted text-ds-text-soft"
              }`}
            >
              {step > 2 ? <Check className="size-3 stroke-[3]" /> : "2"}
            </span>
            <span>{isAr ? "طريقة الدفع" : "Payment"}</span>
          </button>

          <ChevronRight className="size-4 text-ds-border-muted rtl:rotate-180" />

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
              step === 3 ? "text-ds-primary" : "text-ds-text-soft"
            }`}
          >
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[11px] ${
                step === 3
                  ? "border-2 border-ds-primary text-ds-primary"
                  : "border border-ds-border-muted text-ds-text-soft"
              }`}
            >
              3
            </span>
            <span>{isAr ? "المراجعة والتأكيد" : "Review"}</span>
          </button>
        </div>

        {/* Step 1: Address & Map Picker */}
        {step === 1 && (
          <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8 space-y-6">
            <div className="border-b border-ds-border-muted pb-4">
              <h2 className="font-serif text-xl font-semibold text-ds-text-plain">
                {isAr ? "اختر عنوان التوصيل أو حدد على الخريطة" : "Select or Pin Shipping Address"}
              </h2>
              <p className="mt-1 text-xs text-ds-text-muted">
                {isAr
                  ? "يمكنكِ استخدام عنوان محفوظ أو إضافة عنوان جديد وتحديد مكانه بدقة عبر الخريطة التفاعلية"
                  : "Select a saved address or pin a new delivery location on the map"}
              </p>
            </div>

            <AddressList />

            <div className="flex justify-end pt-4 border-t border-ds-border-muted">
              <button
                type="button"
                onClick={() => {
                  if (!selectedAddress) {
                    toast.error(isAr ? "يرجى تحديد عنوان أولاً" : "Please select an address first");
                    return;
                  }
                  setStep(2);
                }}
                className="px-8 py-3.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? "المتابعة لطريقة الدفع" : "Proceed to Payment"}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && (
          <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8 space-y-6">
            <div className="border-b border-ds-border-muted pb-4">
              <h2 className="font-serif text-xl font-semibold text-ds-text-plain">
                {isAr ? "طريقة الدفع" : "Payment Method"}
              </h2>
              <p className="mt-1 text-xs text-ds-text-muted">
                {isAr
                  ? "اختاري وسيلة الدفع المفضلة لديكِ"
                  : "Choose your preferred payment method"}
              </p>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod("DAFTAR_CASH")}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all ${
                  paymentMethod === "DAFTAR_CASH"
                    ? "border-emerald-600 bg-emerald-500/[0.04] shadow-xs ring-2 ring-emerald-500/20"
                    : "border-ds-border-muted bg-ds-plain hover:border-emerald-500/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "DAFTAR_CASH"}
                  onChange={() => setPaymentMethod("DAFTAR_CASH")}
                  className="mt-1 size-4 accent-emerald-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Smartphone className="size-4 text-emerald-600" />
                    <span className="font-semibold text-sm text-ds-text-plain">
                      {isAr
                        ? "فودافون كاش، محافظ إلكترونية، وإنستاباي (دفتر كاش)"
                        : "Vodafone Cash, E-Wallets & InstaPay (DaftarCash)"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {isAr ? "بدون عمولة تحويل" : "Zero Fee"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ds-text-muted">
                    {isAr
                      ? "سداد إلكتروني مباشر وتأكيد فوري عبر فودافون كاش، أورنج، اتصالات، وي باي، أو تطبيق إنستاباي"
                      : "Direct mobile payment via Vodafone Cash, Orange, Etisalat, WE Pay, or InstaPay"}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {["فودافون كاش", "InstaPay", "أورنج كاش", "اتصالات كاش", "WE Pay"].map((brand) => (
                      <span
                        key={brand}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-ds-border-muted bg-ds-subtle text-ds-text-soft"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod("COD")}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all ${
                  paymentMethod === "COD"
                    ? "border-ds-primary bg-ds-primary/[0.03] shadow-xs ring-2 ring-ds-primary/20"
                    : "border-ds-border-muted bg-ds-plain hover:border-ds-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="mt-1 size-4 accent-ds-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="size-4 text-ds-primary" />
                    <span className="font-semibold text-sm text-ds-text-plain">
                      {isAr ? "الدفع عند الاستلام (COD)" : "Cash on Delivery (COD)"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ds-text-muted">
                    {isAr
                      ? "ادفعي نقداً لمندوب الشحن عند استلام الطلب ومعاينته"
                      : "Pay cash in hand upon receiving and inspecting your parcel"}
                  </p>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod("PAYMOB")}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all ${
                  paymentMethod === "PAYMOB"
                    ? "border-ds-primary bg-ds-primary/[0.03] shadow-xs ring-2 ring-ds-primary/20"
                    : "border-ds-border-muted bg-ds-plain hover:border-ds-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "PAYMOB"}
                  onChange={() => setPaymentMethod("PAYMOB")}
                  className="mt-1 size-4 accent-ds-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-ds-primary" />
                    <span className="font-semibold text-sm text-ds-text-plain">
                      {isAr ? "بطاقة بنكية / محفظة إلكترونية (Paymob)" : "Credit / Debit Card / E-Wallet (Paymob)"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ds-text-muted">
                    {isAr
                      ? "دفع إلكتروني آمن ومباشر عبر بوابات الدفع المعتمدة"
                      : "Secure electronic payment powered by Paymob"}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-ds-border-muted">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-full border border-ds-border-muted text-xs font-semibold text-ds-text-plain hover:bg-ds-border-muted/30 transition-colors"
              >
                {isAr ? "رجوع للعنوان" : "Back to Address"}
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? "مراجعة الطلب" : "Review Order"}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Place Order */}
        {step === 3 && (
          <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8 space-y-6">
            <div className="border-b border-ds-border-muted pb-4">
              <h2 className="font-serif text-xl font-semibold text-ds-text-plain">
                {isAr ? "مراجعة وتأكيد الطلب" : "Review & Place Order"}
              </h2>
              <p className="mt-1 text-xs text-ds-text-muted">
                {isAr
                  ? "يرجى التأكد من صحة بيانات التوصيل وطريقة الدفع قبل الإرسال"
                  : "Please verify delivery details and items before confirming"}
              </p>
            </div>

            {/* Selected Address Preview */}
            <div className="rounded-2xl border border-ds-border-muted bg-ds-plain p-4 text-xs text-ds-text-muted space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ds-text-plain text-sm flex items-center gap-1.5">
                  <MapPin className="size-4 text-ds-primary" />
                  {selectedAddress?.title}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-ds-primary font-semibold hover:underline"
                >
                  {isAr ? "تغيير" : "Change"}
                </button>
              </div>
              <p className="text-ds-text-plain font-medium">
                {selectedAddress?.fullName} • {selectedAddress?.phone}
              </p>
              <p>
                {selectedAddress?.governorate}، {selectedAddress?.city}، {selectedAddress?.street}
                {selectedAddress?.building ? `، ${selectedAddress.building}` : ""}
                {selectedAddress?.apartment ? `، ${selectedAddress.apartment}` : ""}
              </p>
              {selectedAddress?.latitude && selectedAddress?.longitude && (
                <p className="font-mono text-[11px] text-ds-text-soft">
                  📍 {selectedAddress.latitude.toFixed(4)}, {selectedAddress.longitude.toFixed(4)}
                </p>
              )}
            </div>

            {/* Payment Method Preview */}
            <div className="rounded-2xl border border-ds-border-muted bg-ds-plain p-4 text-xs text-ds-text-muted flex items-center justify-between">
              <div>
                <span className="font-semibold text-ds-text-plain">
                  {isAr ? "طريقة الدفع:" : "Payment Method:"}
                </span>
                <p className="mt-0.5 text-ds-text-muted">
                  {paymentMethod === "COD"
                    ? isAr ? "الدفع نقداً عند الاستلام" : "Cash on Delivery"
                    : paymentMethod === "DAFTAR_CASH"
                    ? isAr ? "فودافون كاش ومحافظ إلكترونية / إنستاباي (دفتر كاش)" : "Vodafone Cash / InstaPay (DaftarCash)"
                    : isAr ? "بطاقة بنكية / Paymob" : "Card / Paymob"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-ds-primary font-semibold hover:underline"
              >
                {isAr ? "تغيير" : "Change"}
              </button>
            </div>

            {/* Promo Code Section in Step 3 */}
            <div className="rounded-2xl border border-ds-border-muted bg-ds-plain p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-ds-primary" />
                <span className="font-semibold text-xs text-ds-text-plain">
                  {isAr ? "هل لديكِ كود خصم أو قسيمة شراء؟" : "Have a promo code or voucher?"}
                </span>
              </div>
              <CouponInput />
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "ملاحظات إضافية للتوصيل (اختياري)" : "Delivery Notes (optional)"}
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                placeholder={isAr ? "مثال: يرجى الاتصال قبل الوصول بنصف ساعة..." : "e.g. Call 30 mins before arrival..."}
                className="w-full rounded-xl border border-ds-border-muted bg-ds-plain p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ds-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-ds-border-muted">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-full border border-ds-border-muted text-xs font-semibold text-ds-text-plain hover:bg-ds-border-muted/30 transition-colors"
              >
                {isAr ? "رجوع" : "Back"}
              </button>

              <button
                type="button"
                disabled={createOrderMutation.isPending}
                onClick={handlePlaceOrder}
                className={`px-8 py-3.5 rounded-full text-white text-xs font-semibold tracking-wider transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
                  paymentMethod === "DAFTAR_CASH"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-ds-primary hover:bg-ds-primary-saturated"
                }`}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>
                      {paymentMethod === "DAFTAR_CASH"
                        ? isAr
                          ? "جاري تجهيز الفاتورة وتحويلك لدفتر كاش..."
                          : "Redirecting to DaftarCash..."
                        : isAr
                        ? "جاري إنشاء الطلب..."
                        : "Placing order..."}
                    </span>
                  </>
                ) : (
                  <>
                    {paymentMethod === "DAFTAR_CASH" ? (
                      <Smartphone className="size-4" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    <span>
                      {paymentMethod === "DAFTAR_CASH"
                        ? isAr
                          ? "تأكيد الطلب وسداد الفاتورة عبر دفتر كاش"
                          : "Confirm & Pay via DaftarCash"
                        : isAr
                        ? "تأكيد وإتمام الطلب"
                        : "Confirm & Place Order"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Right Column: Order Summary ─── */}
      <div className="rounded-3xl border border-ds-border-muted bg-ds-elevated p-6 sm:p-8 space-y-6 lg:sticky lg:top-24">
        <h3 className="font-serif text-lg font-semibold text-ds-text-plain border-b border-ds-border-muted pb-4">
          {isAr ? "ملخص المنتجات" : "Order Summary"} ({items.length})
        </h3>

        {/* Item mini-list */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {items.map((it) => (
            <div key={`${it.id}-${it.color}-${it.size}`} className="flex items-center gap-3">
              <img
                src={it.image}
                alt={it.title}
                className="size-14 rounded-xl object-cover border border-ds-border-muted shrink-0"
              />
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-semibold text-ds-text-plain truncate">{it.title}</p>
                <p className="text-ds-text-soft mt-0.5">
                  {it.color} • {it.size} • x{it.quantity}
                </p>
                <p className="font-mono text-ds-primary font-medium mt-0.5">
                  {it.price * it.quantity} {isAr ? "ج.م" : "EGP"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-4 border-t border-ds-border-muted pt-4 text-xs">
          {/* Coupon Input */}
          <div className="space-y-2 rounded-2xl bg-ds-plain border border-ds-border-muted p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ds-text-plain">
              <Tag className="size-3.5 text-ds-primary" />
              <span>{isAr ? "كود الخصم أو القسيمة" : "Promo Code or Voucher"}</span>
            </div>
            <CouponInput />
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-ds-text-muted">
              <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
              <span className="font-mono">{subtotal} {isAr ? "ج.م" : "EGP"}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>{isAr ? "خصم الكوبون" : "Coupon Discount"}</span>
                <span className="font-mono">-{discountAmount} {isAr ? "ج.م" : "EGP"}</span>
              </div>
            )}

            <div className="flex justify-between text-ds-text-muted">
              <span>{isAr ? "مصاريف الشحن" : "Shipping"}</span>
              <span className="font-mono">
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-semibold">{isAr ? "مجاني" : "Free"}</span>
                ) : (
                  `${shippingFee} ${isAr ? "ج.م" : "EGP"}`
                )}
              </span>
            </div>

            <div className="flex justify-between border-t border-ds-border-muted pt-3 font-semibold text-sm text-ds-text-plain">
              <span>{isAr ? "المجموع الإجمالي" : "Total Amount"}</span>
              <span className="font-mono text-base text-ds-primary font-bold">
                {totalAmount} {isAr ? "ج.م" : "EGP"}
              </span>
            </div>
          </div>
        </div>

        {/* Guarantee Badge */}
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-ds-subtle/50 p-3 text-xs text-ds-text-soft">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>{isAr ? "تسوق آمن وتوصيل معتمد 100%" : "100% Secure Checkout"}</span>
        </div>
      </div>
    </div>
  );
}
