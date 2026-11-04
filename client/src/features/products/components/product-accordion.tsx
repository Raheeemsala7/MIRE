"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Minus } from "lucide-react";

export function ProductAccordion() {
  const t = useTranslations("pdp.accordions");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [openSection, setOpenSection] = useState<string | null>("details");

  const toggle = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    {
      id: "details",
      title: isRTL ? t("details.title") : t("details.titleEn"),
      content: t("details.content"),
    },
    {
      id: "sizeFit",
      title: isRTL ? t("sizeFit.title") : t("sizeFit.titleEn"),
      content: t("sizeFit.content"),
    },
    {
      id: "shippingReturns",
      title: isRTL ? t("shippingReturns.title") : t("shippingReturns.titleEn"),
      content: t("shippingReturns.content"),
    },
  ];

  return (
    <div className="divide-y divide-ds-border-subtle">
      {sections.map((sec) => {
        const isOpen = openSection === sec.id;
        return (
          <div key={sec.id} className="py-3.5">
            <button
              onClick={() => toggle(sec.id)}
              className="w-full flex items-center justify-between text-start text-xs font-semibold tracking-wider uppercase text-ds-text-plain hover:text-ds-primary transition-colors cursor-pointer group"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2">
                <span>{sec.title}</span>
              </div>
              <div className="p-1 rounded-full text-ds-text-soft group-hover:text-ds-primary transition-colors">
                {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
            </button>

            {isOpen && (
              <div className="mt-2 text-xs text-ds-text-muted leading-relaxed pe-4 animate-in fade-in-50 duration-200">
                {sec.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
