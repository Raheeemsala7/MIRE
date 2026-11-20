"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/src/i18n/navigation";
import { Menu, X, ShoppingBag, UserRound } from "lucide-react";
import { useCartStore } from "../stores/cart-store";
import { CartDrawer } from "./cart-drawer";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getTotalCount, setIsOpen: setCartOpen } = useCartStore();

  const totalCount = getTotalCount();
  const otherLocale = locale === "ar" ? "en" : "ar";
  const isRTL = locale === "ar";

  const handleLanguageToggle = () => {
    router.replace(pathname, { locale: otherLocale });
  };

  const navLinks = [
    { label: t("nav.new"), href: "/#new-arrivals" },
    { label: t("nav.collections"), href: "/#collections" },
    { label: t("nav.products"), href: "/products" },
    { label: t("nav.about"), href: "/#about" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-ds-plain/95 backdrop-blur-md border-b border-ds-border-subtle shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Desktop Navigation - Leading */}
            <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse text-xs tracking-widest uppercase font-medium text-ds-text-plain/85 hover:text-ds-text-plain">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-ds-primary transition-colors py-1 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ds-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
                </Link>
              ))}
            </nav>

            {/* Mobile Hamburger Menu Toggle */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -m-2 rounded-full text-ds-text-plain hover:text-ds-primary hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Centered Brand Logo */}
            <div className="flex-1 md:flex-initial text-center">
              <Link href="/" className="inline-block group">
                <span className="text-2xl sm:text-3xl font-brand-serif font-semibold tracking-wider text-ds-text-plain group-hover:text-ds-primary transition-colors">
                  {t("common.brand")}
                </span>
              </Link>
            </div>

            {/* Trailing Actions: Language Toggle & Prominent Cart Button */}
            <div className="flex items-center space-x-4 sm:space-x-5 rtl:space-x-reverse">
              {/* Language Switcher Pill */}
              <button
                onClick={handleLanguageToggle}
                className="px-3.5 py-1.5 rounded-full border border-ds-border-muted/70 hover:border-ds-primary bg-white/70 hover:bg-white text-xs tracking-wider uppercase font-medium text-ds-text-plain/90 hover:text-ds-primary transition-all cursor-pointer shadow-2xs"
              >
                {t("common.langToggle")}
              </button>

              {/* Sign in uses the unprefixed auth route. */}
              <NextLink
                href="/auth/login"
                aria-label={t("login-submit")}
                onClick={() => setMobileMenuOpen(false)}
                className="flex size-11 items-center justify-center rounded-full text-ds-text-primary transition-colors hover:bg-ds-secondary-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
              >
                <UserRound className="size-4" aria-hidden="true" />
              </NextLink>

              {/* Shopping Bag Button with Icon & Badge */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-2 rounded-full border border-ds-border-muted/70 hover:border-ds-primary bg-white/80 hover:bg-white text-ds-text-plain hover:text-ds-primary transition-all cursor-pointer group shadow-2xs"
                aria-label={t("common.bag")}
              >
                <div className="relative flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-ds-primary group-hover:scale-110 transition-transform" />
                  {totalCount > 0 && (
                    <span className="absolute -top-2 -end-2.5 inline-flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-ds-primary rounded-full shadow-xs">
                      {totalCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-semibold tracking-wider uppercase">
                  {isRTL ? "السلة" : "Bag"}
                </span>
                {totalCount > 0 && (
                  <span className="hidden sm:inline text-xs font-bold text-ds-primary font-mono">
                    ({totalCount})
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-ds-border-subtle bg-ds-plain/98 px-6 py-6 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-col space-y-4 text-sm font-medium tracking-wider uppercase">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-ds-text-plain hover:text-ds-primary transition-colors py-1 border-b border-zinc-100/60 pb-2"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs tracking-wider uppercase">
              <button
                onClick={handleLanguageToggle}
                className="px-3.5 py-1.5 rounded-full border border-ds-border-muted text-ds-primary font-semibold"
              >
                {t("common.langToggle")}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCartOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ds-primary text-white font-semibold"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isRTL ? "سلة المشتريات" : "Cart"}</span>
                <span>({totalCount})</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Slide-over cart drawer */}
      <CartDrawer />
    </>
  );
}
