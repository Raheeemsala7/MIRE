"use client";

import { create } from "zustand";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  color: string;
  size: string;
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string, color: string, size: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) =>
          i.id === newItem.id &&
          i.color === newItem.color &&
          i.size === newItem.size
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += 1;
        return { items: updated };
      }

      return { items: [...state.items, { ...newItem, quantity: 1 }] };
    });
  },
  removeItem: (id, color, size) => {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.id === id && i.color === color && i.size === size)
      ),
    }));
  },
  setIsOpen: (isOpen) => set({ isOpen }),
  getTotalCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));

