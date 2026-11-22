"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address, AddressStore } from "../types/address";

const INITIAL_ADDRESSES: Address[] = [
  {
    id: "default-addr-1",
    title: "المنزل (الرئيسي)",
    fullName: "عميل ميري",
    phone: "+201012345678",
    governorate: "القاهرة",
    city: "المعادي",
    street: "شارع ٩ - دجلة",
    building: "عمارة ١٥",
    apartment: "شقة ٤",
    landmark: "بجوار محطة المترو",
    latitude: 29.9602,
    longitude: 31.2569,
    isDefault: true,
  },
];

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: INITIAL_ADDRESSES,
      selectedAddressId: "default-addr-1",
      addAddress: (addressData) => {
        const newAddress: Address = {
          ...addressData,
          id: `addr-${Date.now()}`,
        };

        set((state) => {
          let updatedAddresses = [...state.addresses];
          if (newAddress.isDefault) {
            updatedAddresses = updatedAddresses.map((a) => ({
              ...a,
              isDefault: false,
            }));
          }
          return {
            addresses: [...updatedAddresses, newAddress],
            selectedAddressId: newAddress.id,
          };
        });

        return newAddress;
      },
      updateAddress: (id, partial) => {
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id ? { ...a, ...partial } : a
          ),
        }));
      },
      removeAddress: (id) => {
        set((state) => {
          const filtered = state.addresses.filter((a) => a.id !== id);
          return {
            addresses: filtered,
            selectedAddressId:
              state.selectedAddressId === id
                ? filtered[0]?.id || null
                : state.selectedAddressId,
          };
        });
      },
      selectAddress: (id) => set({ selectedAddressId: id }),
      getSelectedAddress: () => {
        const { addresses, selectedAddressId } = get();
        return (
          addresses.find((a) => a.id === selectedAddressId) ||
          addresses.find((a) => a.isDefault) ||
          addresses[0] ||
          null
        );
      },
    }),
    {
      name: "mire-addresses",
    }
  )
);
