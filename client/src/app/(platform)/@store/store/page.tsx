import Link from "next/link";
import { requireRole } from "@/lib/auth/session";

export const instant = false;

export default async function StorePage() {
  const user = await requireRole(["CUSTOMER"]);
  return <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10"><h1 className="font-serif text-4xl sm:text-5xl">Welcome back, {user.name}</h1><p className="mt-5 text-ds-text-muted">Your MIRÉ account is ready. Find something lovely today.</p><Link href="/en/products" className="mt-9 inline-flex rounded-full bg-ds-primary px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-ds-primary-saturated">Explore the collection</Link></main>;
}
