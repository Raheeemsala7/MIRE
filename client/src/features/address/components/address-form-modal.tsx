"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin, X, Check } from "lucide-react";
import { useAddressStore } from "../store/address.store";
import type { Address } from "../types/address";

const MapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-60 w-full items-center justify-center rounded-2xl border border-ds-border-muted bg-ds-subtle text-xs text-ds-text-muted">
      <Loader2 className="size-4 animate-spin me-2" />
      جاري تحميل الخريطة...
    </div>
  ),
});

export const EGYPT_GOVERNORATES = [
  { ar: "القاهرة", en: "Cairo" },
  { ar: "الجيزة", en: "Giza" },
  { ar: "الإسكندرية", en: "Alexandria" },
  { ar: "القليوبية", en: "Qalyubia" },
  { ar: "الشرقية", en: "Sharqia" },
  { ar: "الدقهلية", en: "Dakahlia" },
  { ar: "الغربية", en: "Gharbia" },
  { ar: "المنوفية", en: "Monufia" },
  { ar: "البحيرة", en: "Beheira" },
  { ar: "كفر الشيخ", en: "Kafr El Sheikh" },
  { ar: "دمياط", en: "Damietta" },
  { ar: "بورسعيد", en: "Port Said" },
  { ar: "الإسماعيلية", en: "Ismailia" },
  { ar: "السويس", en: "Suez" },
  { ar: "بني سويف", en: "Beni Suef" },
  { ar: "الفيوم", en: "Faiyum" },
  { ar: "المنيا", en: "Minya" },
  { ar: "أسيوط", en: "Asyut" },
  { ar: "سوهاج", en: "Sohag" },
  { ar: "قنا", en: "Qena" },
  { ar: "الأقصر", en: "Luxor" },
  { ar: "أسوان", en: "Aswan" },
  { ar: "البحر الأحمر", en: "Red Sea" },
  { ar: "جنوب سيناء", en: "South Sinai" },
];

const addressSchema = z.object({
  title: z.string().min(2, "العنوان التعريفي مطلوب"),
  fullName: z.string().min(2, "الاسم بالكامل مطلوب"),
  phone: z.string().min(10, "رقم هاتف صالح مطلوب"),
  governorate: z.string().min(2, "المحافظة مطلوبة"),
  city: z.string().min(2, "المدينة أو الحي مطلوب"),
  street: z.string().min(3, "اسم الشارع مطلوب"),
  building: z.string().optional(),
  apartment: z.string().optional(),
  landmark: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  isDefault: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (address: Address) => void;
}

export function AddressFormModal({
  open,
  onClose,
  onSuccess,
}: AddressFormModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { addAddress } = useAddressStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: isAr ? "المنزل" : "Home",
      fullName: "",
      phone: "",
      governorate: "القاهرة",
      city: "",
      street: "",
      building: "",
      apartment: "",
      landmark: "",
      latitude: 30.0444,
      longitude: 31.2357,
      isDefault: true,
    },
  });

  const lat = watch("latitude");
  const lng = watch("longitude");

  if (!open) return null;

  const handleMapChange = (newLat: number, newLng: number) => {
    setValue("latitude", newLat, { shouldValidate: true });
    setValue("longitude", newLng, { shouldValidate: true });
  };

  const onSubmit = (data: AddressFormData) => {
    setSubmitting(true);
    try {
      const created = addAddress(data);
      reset();
      onClose();
      if (onSuccess) onSuccess(created);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-ds-plain p-6 sm:p-8 shadow-2xl border border-ds-border-muted"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ds-border-muted pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-ds-primary/10 text-ds-primary">
              <MapPin className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-ds-text-plain">
                {isAr ? "إضافة عنوان جديد والتحديد على الخريطة" : "Add Address & Pin on Map"}
              </h2>
              <p className="text-xs text-ds-text-muted">
                {isAr
                  ? "انقري على الخريطة أو اسحبي المؤشر لتحديد موقع التوصيل الدقيق"
                  : "Click or drag the marker to pin your exact delivery location"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center hover:bg-ds-border-muted/50 text-ds-text-soft transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Map Picker */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-ds-text-plain font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-ds-primary" />
              {isAr ? "موقع الخريطة (انقر للتحديد):" : "Location on map (click to set):"}
            </span>
            <span className="font-mono text-ds-text-soft text-[11px]">
              {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </span>
          </div>
          <MapPicker lat={lat} lng={lng} onChange={handleMapChange} />
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "تسمية العنوان (مثل: المنزل، العمل)" : "Address Title (e.g. Home, Office)"}
              </label>
              <input
                {...register("title")}
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
                placeholder={isAr ? "المنزل" : "Home"}
              />
              {errors.title && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "اسم المستلم بالكامل" : "Full Name"}
              </label>
              <input
                {...register("fullName")}
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
                placeholder={isAr ? "سارة محمد" : "Sarah Mohamed"}
              />
              {errors.fullName && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.fullName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "رقم الهاتف" : "Phone Number"}
              </label>
              <input
                {...register("phone")}
                dir="ltr"
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary text-start"
                placeholder="+201012345678"
              />
              {errors.phone && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "المحافظة" : "Governorate"}
              </label>
              <select
                {...register("governorate")}
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
              >
                {EGYPT_GOVERNORATES.map((gov) => (
                  <option key={gov.en} value={isAr ? gov.ar : gov.en}>
                    {isAr ? gov.ar : gov.en}
                  </option>
                ))}
              </select>
              {errors.governorate && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.governorate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "المدينة / الحي" : "City / District"}
              </label>
              <input
                {...register("city")}
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
                placeholder={isAr ? "المعادي" : "Maadi"}
              />
              {errors.city && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "اسم الشارع" : "Street"}
              </label>
              <input
                {...register("street")}
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
                placeholder={isAr ? "شارع 9" : "Street 9"}
              />
              {errors.street && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.street.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "رقم العمارة" : "Building No."}
              </label>
              <input
                {...register("building")}
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
                placeholder={isAr ? "عمارة 15" : "Bldg 15"}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "رقم الشقة / الدور" : "Apt / Floor"}
              </label>
              <input
                {...register("apartment")}
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
                placeholder={isAr ? "شقة 4" : "Apt 4"}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ds-text-plain mb-1.5">
                {isAr ? "علامة مميزة (اختياري)" : "Landmark (optional)"}
              </label>
              <input
                {...register("landmark")}
                className="h-11 w-full rounded-xl border border-ds-border-muted bg-ds-elevated px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary"
                placeholder={isAr ? "بجوار المترو" : "Near Metro"}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register("isDefault")}
                className="size-4 rounded accent-ds-primary"
              />
              <span className="text-xs text-ds-text-plain">
                {isAr ? "تعيين كعنوان رئيسي للتوصيل" : "Set as default shipping address"}
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ds-border-muted">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-full border border-ds-border-muted text-xs font-semibold text-ds-text-plain hover:bg-ds-border-muted/30 transition-colors"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 px-6 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-wider transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              <span>{isAr ? "حفظ العنوان والموقع" : "Save Address & Location"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
