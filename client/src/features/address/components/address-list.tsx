"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, MapPin } from "lucide-react";
import { useAddressStore } from "../store/address.store";
import { AddressCard } from "./address-card";
import { AddressFormModal } from "./address-form-modal";

interface AddressListProps {
  onSelectAddress?: (id: string) => void;
  selectedId?: string | null;
}

export function AddressList({
  onSelectAddress,
  selectedId: propSelectedId,
}: AddressListProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [modalOpen, setModalOpen] = useState(false);

  const {
    addresses,
    selectedAddressId: storeSelectedId,
    selectAddress,
    removeAddress,
  } = useAddressStore();

  const activeId = propSelectedId !== undefined ? propSelectedId : storeSelectedId;

  const handleSelect = (id: string) => {
    selectAddress(id);
    if (onSelectAddress) onSelectAddress(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ds-text-plain uppercase tracking-wider">
          {isAr ? "العناوين المحفوظة" : "Saved Addresses"}
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ds-primary hover:text-ds-primary-saturated transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>{isAr ? "إضافة عنوان جديد بالخريطة" : "Add Address with Map"}</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-ds-border-muted bg-ds-subtle/30 text-center">
          <MapPin className="size-8 text-ds-text-soft" />
          <p className="mt-2 text-xs font-medium text-ds-text-plain">
            {isAr ? "لم تقومي بإضافة أي عنوان بعد" : "No addresses added yet"}
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-full bg-ds-primary text-white text-xs font-semibold hover:bg-ds-primary-saturated transition-all shadow-xs"
          >
            {isAr ? "إضافة عنوانك الأول والتحديد على الخريطة" : "Add Your First Address"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              selected={address.id === activeId}
              onSelect={() => handleSelect(address.id)}
              onDelete={
                addresses.length > 1 ? () => removeAddress(address.id) : undefined
              }
            />
          ))}
        </div>
      )}

      <AddressFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(created) => handleSelect(created.id)}
      />
    </div>
  );
}
