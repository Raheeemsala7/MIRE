"use client";

import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { useWishlistStore } from "../store/wishlist.store";

export function WishlistButton() {
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore((state) => state.items);
  const count = items.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      href="/wishlist"
      aria-label="Wishlist"
      className="relative flex items-center justify-center size-9 sm:size-10 rounded-full border border-ds-border-muted/70 hover:border-ds-primary bg-white/70 dark:bg-zinc-900/70 hover:bg-white text-ds-text-plain hover:text-ds-primary shadow-2xs transition-all duration-200 group cursor-pointer"
    >
      <Heart className="size-4 group-hover:scale-110 transition-transform duration-200" />
      {mounted && count > 0 && (
        <span className="absolute -top-1.5 -end-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-xs ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
