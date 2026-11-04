"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { toast } from "sonner";
import { BotanicalIcon } from "./botanical-icon";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const isRTL = locale === "ar";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(isRTL ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address");
      return;
    }
    toast.success(t("newsletter.successToast"));
    setEmail("");
  };

  return (
    <footer className="w-full mt-auto">
      {/* ─── Soft Lilac Newsletter & Brand Community Banner ─── */}
      <div className="bg-ds-secondary/40 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative botanical icons */}
        <div className="absolute -left-6 -bottom-6 opacity-20 pointer-events-none text-ds-primary rotate-12">
          <BotanicalIcon size={120} />
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none text-ds-primary -rotate-12">
          <BotanicalIcon size={120} />
        </div>

        <div className="max-w-2xl mx-auto text-center relative z-10 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-brand-serif tracking-widest text-ds-text-plain">
            {t("common.brand")}
          </h2>
          <p className="text-sm md:text-base text-ds-text-muted font-medium">
            {t("newsletter.title")}
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.placeholder")}
              className="w-full sm:flex-1 px-5 py-3 rounded-full bg-white text-sm text-ds-text-plain placeholder-zinc-400 border border-ds-border-muted/50 focus:outline-none focus:ring-2 focus:ring-ds-primary/40 shadow-xs"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-xs cursor-pointer"
            >
              {t("newsletter.subscribe")}
            </button>
          </form>

          {/* Quick links beneath newsletter */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-ds-text-muted">
            <Link href="/#about" className="hover:text-ds-primary transition-colors">
              {t("nav.about")}
            </Link>
            <Link href="/products" className="hover:text-ds-primary transition-colors">
              {t("nav.products")}
            </Link>
            <Link href="/#help" className="hover:text-ds-primary transition-colors">
              {t("footer.shipping")}
            </Link>
            <Link href="/#help" className="hover:text-ds-primary transition-colors">
              {t("footer.contact")}
            </Link>
          </div>

          <p className="text-[11px] text-ds-text-soft pt-2">
            © {t("common.brand")} 2026. {t("footer.rights")}
          </p>
        </div>
      </div>

      {/* ─── Luxury Noir / Charcoal Primary Footer ─── */}
      <div className="bg-ds-footer text-zinc-300 py-16 px-4 sm:px-6 lg:px-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-3xl font-brand-serif tracking-widest text-white inline-block">
              {t("common.brand")}
            </span>
            <p className="text-xs text-zinc-400 tracking-wider">
              {t("common.brandSubtitle")}
            </p>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed pt-1">
              {t("footer.brandDescription")}
            </p>
          </div>

          {/* Shop Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase">
              {t("footer.shop")}
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <Link href="/#collections" className="hover:text-white transition-colors">
                  {t("categories.items.abaya.name")}
                </Link>
              </li>
              <li>
                <Link href="/#collections" className="hover:text-white transition-colors">
                  {t("categories.items.khimar.name")}
                </Link>
              </li>
              <li>
                <Link href="/#collections" className="hover:text-white transition-colors">
                  {t("categories.items.isdal.name")}
                </Link>
              </li>
              <li>
                <Link href="/#collections" className="hover:text-white transition-colors">
                  {t("categories.items.gilba.name")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Help Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-widest text-white uppercase">
              {t("footer.help")}
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <Link href="/#help" className="hover:text-white transition-colors">
                  {t("footer.shipping")}
                </Link>
              </li>
              <li>
                <Link href="/#help" className="hover:text-white transition-colors">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link href="/#help" className="hover:text-white transition-colors">
                  {t("footer.sizeGuide")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

