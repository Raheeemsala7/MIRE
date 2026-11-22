"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  color: string;
  size: string;
  image: string;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  discountValue: number;
  discountAmount: number;
  minOrderAmount?: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  coupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, color: string, size: string, quantity: number) => void;
  removeItem: (id: string, color: string, size: string) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
  getDiscountAmount: () => number;
  getFinalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      coupon: null,
      addItem: (newItem) => {
        const qty = newItem.quantity || 1;
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.id === newItem.id &&
              i.color === newItem.color &&
              i.size === newItem.size
          );

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += qty;
            return { items: updated };
          }

          return { items: [...state.items, { ...newItem, quantity: qty }] };
        });
      },
      updateQuantity: (id, color, size, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (i) => !(i.id === id && i.color === color && i.size === size)
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              i.id === id && i.color === color && i.size === size
                ? { ...i, quantity }
                : i
            ),
          };
        });
      },
      removeItem: (id, color, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.id === id && i.color === color && i.size === size)
          ),
        }));
      },
      clearCart: () => set({ items: [], coupon: null }),
      setIsOpen: (isOpen) => set({ isOpen }),
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
      getDiscountAmount: () => {
        const subtotal = get().getTotalPrice();
        const coupon = get().coupon;
        if (!coupon || subtotal <= 0) return 0;
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) return 0;
        if (coupon.discountType === "PERCENTAGE") {
          return Math.round((subtotal * coupon.discountValue) / 100);
        }
        return Math.min(coupon.discountValue, subtotal);
      },
      getFinalPrice: () => {
        const subtotal = get().getTotalPrice();
        const discount = get().getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: "mire-cart",
    }
  )
);
