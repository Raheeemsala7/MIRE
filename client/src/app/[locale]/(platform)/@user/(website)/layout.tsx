import React, { Suspense } from "react";
import { Header } from "@/shared/components/header";
import { Footer } from "@/shared/components/footer";

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-40 w-full bg-ds-plain/95 border-b border-ds-border-subtle h-20 flex items-center justify-between px-8">
      <div className="w-24 h-4 bg-ds-secondary/30 rounded-full animate-pulse" />
      <span className="text-2xl font-brand-serif font-semibold tracking-wider text-ds-text-plain">
        MIRÉ
      </span>
      <div className="w-24 h-4 bg-ds-secondary/30 rounded-full animate-pulse" />
    </header>
  );
}

function FooterFallback() {
  return <footer className="w-full h-48 bg-ds-footer animate-pulse" />;
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
      <Suspense fallback={<FooterFallback />}>
        <Footer />
      </Suspense>
    </>
  );
}
