import { Suspense } from "react";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full"><Suspense fallback={<AuthSkeleton />}>{children}</Suspense></div>;
}
