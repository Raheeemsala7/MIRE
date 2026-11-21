"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function FooterNewsletterForm() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(t("invalidEmail"));
      return;
    }
    toast.success(t("successToast"));
    setEmail("");
  };

  return (
    <form
      onSubmit={handleSubscribe}
      className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-md mx-auto"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("placeholder")}
        className="w-full sm:flex-1 px-5 py-3 rounded-full bg-white text-sm text-ds-text-plain placeholder-zinc-400 border border-ds-border-muted/50 focus:outline-none focus:ring-2 focus:ring-ds-primary/40 shadow-xs"
        required
      />
      <button
        type="submit"
        className="w-full sm:w-auto px-7 py-3 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-xs cursor-pointer"
      >
        {t("subscribe")}
      </button>
    </form>
  );
}
