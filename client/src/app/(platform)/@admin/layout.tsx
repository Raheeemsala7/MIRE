import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/login/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen"><header className="flex items-center justify-between border-b border-ds-border-subtle px-6 py-5 sm:px-10"><Link href="/admin/dashboard" className="font-serif text-2xl tracking-[.15em] text-ds-text-primary">MIRÉ <span className="ml-3 font-sans text-xs tracking-normal text-ds-text-muted">Admin</span></Link><LogoutButton /></header>{children}</div>;
}
