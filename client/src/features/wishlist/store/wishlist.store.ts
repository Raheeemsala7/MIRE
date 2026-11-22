"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WishlistProduct, WishlistStore } from "../types/wishlist";

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (product) => {
        set((state) => {
          const exists = state.items.some((i) => i.id === product.id);
          if (exists) {
            return { items: state.items.filter((i) => i.id !== product.id) };
          }
          return { items: [...state.items, product] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));
      },
      clearWishlist: () => set({ items: [] }),
      isWishlisted: (productId) => {
        return get().items.some((i) => i.id === productId);
      },
      getCount: () => {
        return get().items.length;
      },
    }),
    {
      name: "mire-wishlist",
    }
  )
);
