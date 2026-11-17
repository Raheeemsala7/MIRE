"use client";

import React from "react";
import { Toaster } from "sonner";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import ReactQueryProvider from "./global/react-query-providers";

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  const isRTL = locale === "ar";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ReactQueryProvider>
        <Toaster
          richColors
          position={isRTL ? "bottom-left" : "bottom-right"}
          toastOptions={{
            style: {
              fontFamily: isRTL ? "var(--font-arabic)" : "var(--font-sans)",
              borderRadius: "9999px",
              padding: "12px 20px",
            },
          }}
        />
        {children}
      </ReactQueryProvider>
    </NextIntlClientProvider>
  );
}
