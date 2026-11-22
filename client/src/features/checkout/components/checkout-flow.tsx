"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
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

  const { items, getTotalPrice, getDiscountAmount, coupon, clearCart } = useCartStore();
  const { getSelectedAddress } = useAddressStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [orderNotes, setOrderNotes] = useState("");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  const createOrderMutation = useCreateOrder(
    (createdOrder) => {
      // Save order to localStorage for offline / guest access
      try {
        const stored = localStorage.getItem("mire-recent-orders");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(createdOrder);
        localStorage.setItem("mire-recent-orders", JSON.stringify(list.slice(0, 20)));
      } catch {}

      clearCart();
      setPlacedOrder(createdOrder);
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
      </div>
    );
  }

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast.error(isAr ? "يرجى تحديد أو إضافة عنوان التوصيل أولاً" : "Please select or add a shipping address");
      setStep(1);
      return;
    }

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
                className="px-8 py-3.5 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                <span>{isAr ? "تأكيد وإتمام الطلب" : "Confirm & Place Order"}</span>
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
