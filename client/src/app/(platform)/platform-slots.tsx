"use client";

import { usePathname } from "next/navigation";

export function PlatformSlots({ admin, store, children }: { admin: React.ReactNode; store: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin/")) return admin;
  if (pathname === "/store") return store;
  return children;
}
