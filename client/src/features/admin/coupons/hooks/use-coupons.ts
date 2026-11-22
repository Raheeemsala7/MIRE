"use client";

export const couponQueryKeys = {
  all: ["admin", "coupons"] as const,
  lists: () => [...couponQueryKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) => [...couponQueryKeys.lists(), filters] as const,
  detail: (id: string) => [...couponQueryKeys.all, "detail", id] as const,
};
