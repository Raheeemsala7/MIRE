"use client";

import React from "react";
import { useLocale } from "next-intl";
import { MapPin, Phone, User, Check, Trash2 } from "lucide-react";
import type { Address } from "../types/address";

interface AddressCardProps {
  address: Address;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

export function AddressCard({
  address,
  selected = false,
  onSelect,
  onDelete,
}: AddressCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border p-5 transition-all cursor-pointer text-start ${
        selected
          ? "border-ds-primary bg-ds-primary/[0.03] shadow-xs ring-2 ring-ds-primary/20"
          : "border-ds-border-muted bg-ds-elevated hover:border-ds-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-5 items-center justify-center rounded-full border transition-all ${
              selected
                ? "border-ds-primary bg-ds-primary text-white"
                : "border-ds-border-muted bg-white"
            }`}
          >
            {selected && <Check className="size-3 stroke-[3]" />}
          </div>
          <h3 className="font-semibold text-sm text-ds-text-plain">
            {address.title}
          </h3>
          {address.isDefault && (
            <span className="rounded-full bg-ds-primary/10 px-2 py-0.5 text-[10px] font-semibold text-ds-primary">
              {isAr ? "افتراضي" : "Default"}
            </span>
          )}
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-ds-text-soft hover:text-rose-600 transition-colors p-1"
            title={isAr ? "حذف العنوان" : "Delete address"}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-ds-text-muted">
        <div className="flex items-center gap-2 text-ds-text-plain font-medium">
          <User className="size-3.5 text-ds-text-soft" />
          <span>{address.fullName}</span>
          <span className="text-ds-border-muted">•</span>
          <Phone className="size-3.5 text-ds-text-soft" />
          <span dir="ltr">{address.phone}</span>
        </div>

        <div className="flex items-start gap-2 pt-1 text-ds-text-muted">
          <MapPin className="size-3.5 text-ds-primary mt-0.5 shrink-0" />
          <span>
            {address.governorate}، {address.city}، {address.street}
            {address.building ? `، ${isAr ? "عمارة" : "Bldg"} ${address.building}` : ""}
            {address.apartment ? `، ${isAr ? "شقة" : "Apt"} ${address.apartment}` : ""}
            {address.landmark ? ` (${address.landmark})` : ""}
          </span>
        </div>

        {address.latitude && address.longitude && (
          <div className="pt-1 text-[11px] text-ds-text-soft flex items-center gap-1 font-mono">
            <span>📍 {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
