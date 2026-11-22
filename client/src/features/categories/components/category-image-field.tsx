"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImageIcon, X, AlertCircle } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";

interface CategoryImageFieldProps {
  value?: string;
  onChange: (url: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CategoryImageField({
  value = "",
  onChange,
  error,
  disabled = false,
}: CategoryImageFieldProps) {
  const t = useTranslations();
  const [imgError, setImgError] = React.useState(false);

  // Reset image error state whenever URL value changes
  React.useEffect(() => {
    setImgError(false);
  }, [value]);

  const hasValidUrl = Boolean(
    value &&
      !imgError &&
      (value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("/"))
  );

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="category-image-url" className="text-sm font-medium">
          {t("category-form-image-label")}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("category-form-image-desc")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Preview Container */}
        <div className="relative size-24 shrink-0 rounded-xl border border-border/70 bg-muted/40 overflow-hidden flex items-center justify-center shadow-2xs group">
          {hasValidUrl ? (
            <Image
              src={value}
              alt="Category Preview"
              fill
              sizes="96px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
              {imgError ? (
                <>
                  <AlertCircle className="size-6 text-rose-500 mb-1" />
                  <span className="text-[10px] text-rose-500 font-medium">
                    {t("category-form-image-invalid-url")}
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon className="size-6 opacity-40 mb-1" />
                  <span className="text-[10px] opacity-60">
                    {t("category-form-image-no-image")}
                  </span>
                </>
              )}
            </div>
          )}

          {hasValidUrl && !disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon-xs"
              onClick={() => onChange("")}
              className="absolute top-1 end-1 size-5 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        {/* URL Input */}
        <div className="flex-1 w-full space-y-1.5">
          <Input
            id="category-image-url"
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("category-form-image-placeholder")}
            disabled={disabled}
            className={`w-full font-mono text-xs ${
              error ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
            dir="ltr"
          />
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
}
