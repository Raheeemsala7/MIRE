"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Check, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/shared/stores/cart-store";
import { ProductDetail } from "../types/product";
import { ProductAccordion } from "./product-accordion";

interface ProductViewProps {
  product: ProductDetail;
}

export function ProductView({ product }: ProductViewProps) {
  const t = useTranslations("pdp");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedImage, setSelectedImage] = useState(product.colors[0].image);

  const addItem = useCartStore((state) => state.addItem);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  const handleColorChange = (color: (typeof product.colors)[0]) => {
    setSelectedColor(color);
    setSelectedImage(color.image);
  };

  const handleAddToBag = () => {
    addItem({
      id: product.id,
      title: isRTL ? product.titleAr : product.titleEn,
      price: product.price,
      color: isRTL ? selectedColor.nameAr : selectedColor.nameEn,
      size: selectedSize,
      image: selectedImage,
    });

    toast.success(
      isRTL
        ? `تمت إضافة "${product.titleAr} (${selectedColor.nameAr} - ${selectedSize})" إلى حقيبة التسوق`
        : `Added "${product.titleEn} (${selectedColor.nameEn} - ${selectedSize})" to your bag`,
      {
        action: {
          label: isRTL ? "عرض الحقيبة" : "View Bag",
          onClick: () => setIsOpen(true),
        },
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
      {/* ─── Left Column: Gallery (Vertical Thumbnails + Main View) ─── */}
      <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
        {/* Thumbnails list */}
        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 shrink-0">
          {product.colors.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedColor(c);
                setSelectedImage(c.image);
              }}
              className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-ds-secondary/20 ${
                selectedImage === c.image
                  ? "border-ds-primary shadow-xs ring-2 ring-ds-primary/20"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={c.image}
                alt={isRTL ? c.nameAr : c.nameEn}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* Main High-Resolution Photo */}
        <div className="flex-1 relative aspect-3/4 rounded-lg overflow-hidden bg-ds-secondary/20 shadow-xs border border-ds-border-subtle">
          <Image
            src={selectedImage}
            alt={isRTL ? product.titleAr : product.titleEn}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover transition-all duration-300"
          />
        </div>
      </div>

      {/* ─── Right Column: Information & Actions ─── */}
      <div className="lg:col-span-5 space-y-6 text-start">
        {/* Category kicker */}
        <div className="text-xs uppercase tracking-widest text-ds-text-soft font-semibold">
          {isRTL ? product.categoryAr : product.categoryEn}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-ds-text-plain font-brand-serif">
            {isRTL ? product.titleAr : product.titleEn}
          </h1>
          <p className="text-sm sm:text-base text-ds-primary font-medium tracking-wide">
            {isRTL ? product.titleEn : product.titleAr}
          </p>
        </div>

        {/* Price */}
        <div className="text-2xl font-bold text-ds-text-plain tracking-tight">
          {product.price}{" "}
          <span className="text-sm font-medium text-ds-text-muted">
            {commonT("currency")}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-ds-text-muted leading-relaxed">
          {isRTL ? product.descriptionAr : product.descriptionEn}
        </p>

        {/* Colour Selection */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-ds-text-plain">
            <span>
              {t("colour")}:{" "}
              <span className="text-ds-primary font-bold">
                {isRTL ? selectedColor.nameAr : selectedColor.nameEn}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {product.colors.map((c) => {
              const isSelected = selectedColor.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleColorChange(c)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "border-ds-primary bg-ds-primary/10 text-ds-primary shadow-2xs font-semibold"
                      : "border-ds-border-muted bg-white text-ds-text-plain hover:border-ds-primary/50"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{isRTL ? c.nameAr : c.nameEn}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ms-1 text-ds-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Size Selection */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-ds-text-plain">
            <span>
              {t("size")}:{" "}
              <span className="text-ds-primary font-bold">{selectedSize}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {product.sizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-11 h-11 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-ds-primary text-white shadow-xs"
                      : "bg-white border border-ds-border-muted text-ds-text-plain hover:border-ds-primary/60"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA Button: Add to Bag */}
        <div className="pt-3">
          <button
            onClick={handleAddToBag}
            className="w-full py-4 px-6 rounded-full bg-ds-primary hover:bg-ds-primary-saturated text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t("addToBag")}</span>
          </button>
        </div>

        {/* Accordions */}
        <div className="pt-4 border-t border-ds-border-subtle">
          <ProductAccordion />
        </div>
      </div>
    </div>
  );
}
