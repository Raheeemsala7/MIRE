"use client";

// React Hook Form returns non-memoizable functions; React Compiler skips memoizing this component as intended.
/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  Package,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useProducts } from "@/features/products/hooks/use-products";
import { useAdjustStock } from "../hooks/use-adjust-stock";
import { formatQuantityChange } from "../utils/inventory.util";
import {
  adjustStockSchema,
  type AdjustStockFormValues,
} from "../schemas/inventory.schema";
import type {
  StockAdjustmentType,
  LowStockItem,
} from "../types/inventory.types";
import type { Product, ProductVariantItem } from "@/features/products";

interface StockAdjustmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  preselectedItem?: LowStockItem | null;
}

export function StockAdjustmentForm({
  onSuccess,
  onCancel,
  preselectedItem,
}: StockAdjustmentFormProps) {
  // Translation
  const t = useTranslations();
  const locale = useLocale();

  // State
  const [selectedFromPreselect, setSelectedFromPreselect] =
    React.useState<LowStockItem | null>(preselectedItem ?? null);
  const [productSearch, setProductSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [selectedVariant, setSelectedVariant] =
    React.useState<ProductVariantItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  // Form & validation
  const form = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      productId: preselectedItem?.productId ?? "",
      variantSku: preselectedItem?.variantSku ?? "",
      quantityChange: "" as unknown as number,
      type: "ADJUSTMENT",
      reason: "",
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedQuantity = watch("quantityChange");
  const watchedType = watch("type");
  const watchedReason = watch("reason");

  // Effects
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Sync if preselectedItem changes
  React.useEffect(() => {
    if (preselectedItem) {
      setSelectedFromPreselect(preselectedItem);
      setValue("productId", preselectedItem.productId, { shouldValidate: true });
      setValue("variantSku", preselectedItem.variantSku, { shouldValidate: true });
    }
  }, [preselectedItem, setValue]);

  // Queries
  const { data: productsData } = useProducts({
    search: debouncedSearch || undefined,
    limit: 6,
  });

  const productSearchResults = React.useMemo(() => {
    return productsData?.data ?? [];
  }, [productsData]);

  // Mutation
  const { mutate: adjustStock, isPending } = useAdjustStock(() => {
    setIsConfirmOpen(false);
    onSuccess();
  });

  // Target item details
  const activeProductId = selectedFromPreselect
    ? selectedFromPreselect.productId
    : selectedProduct?._id;
  const activeProductName = selectedFromPreselect
    ? selectedFromPreselect.productName
    : selectedProduct?.name;
  const activeProductSku = selectedFromPreselect
    ? selectedFromPreselect.productSku
    : selectedProduct?.sku;
  const activeVariantSku = selectedFromPreselect
    ? selectedFromPreselect.variantSku
    : selectedVariant?.sku;
  const activeVariantLabel = selectedFromPreselect
    ? `${selectedFromPreselect.color} / ${selectedFromPreselect.size}`
    : selectedVariant
    ? `${selectedVariant.color} / ${selectedVariant.size}`
    : "";
  const currentStock = selectedFromPreselect
    ? selectedFromPreselect.stockQuantity
    : selectedVariant?.stockQuantity ?? 0;

  // Stock preview math
  const parsedQuantityChange =
    typeof watchedQuantity === "number"
      ? watchedQuantity
      : parseInt(String(watchedQuantity || ""), 10);
  const isQuantityValid =
    !isNaN(parsedQuantityChange) && parsedQuantityChange !== 0;
  const expectedStock = isQuantityValid
    ? currentStock + parsedQuantityChange
    : currentStock;
  const isNegativeStock = isQuantityValid && expectedStock < 0;

  const canReview =
    Boolean(activeProductId) &&
    Boolean(activeVariantSku) &&
    isQuantityValid &&
    !isNegativeStock &&
    Boolean(watchedReason && watchedReason.trim().length >= 3);

  // Translation helper for validation errors
  const resolveError = (msg?: string) => (msg ? t(msg) || msg : null);

  // Functions
  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setValue("productId", product._id, { shouldValidate: true });
    if (product.variants.length === 1) {
      const v = product.variants[0];
      setSelectedVariant(v);
      setValue("variantSku", v.sku, { shouldValidate: true });
    } else {
      setSelectedVariant(null);
      setValue("variantSku", "", { shouldValidate: true });
    }
  }

  function handleClearProduct() {
    setSelectedFromPreselect(null);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setProductSearch("");
    setValue("productId", "", { shouldValidate: true });
    setValue("variantSku", "", { shouldValidate: true });
  }

  function handleReviewSubmit() {
    if (canReview) {
      setIsConfirmOpen(true);
    }
  }

  function handleConfirmSubmit() {
    if (isPending) return;
    if (!activeProductId || !activeVariantSku || !isQuantityValid) return;

    adjustStock({
      productId: activeProductId,
      variantSku: activeVariantSku,
      quantityChange: parsedQuantityChange,
      type: watchedType,
      reason: (watchedReason || "").trim(),
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleReviewSubmit)} className="space-y-5">
        {/* Step 1: Select Product */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            {t("inventory-adjust-select-product") || "Select Product"} *
          </Label>

          {activeProductName ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
                  <Package className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground line-clamp-1">
                    {activeProductName}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    SKU: {activeProductSku}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearProduct}
                disabled={isPending}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("inventory-btn-change") || "Change"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={
                    t("inventory-adjust-search-placeholder") ||
                    "Search products by name or SKU..."
                  }
                  className="ps-9 h-9 text-xs"
                />
              </div>

              {/* Search dropdown results */}
              {productSearchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md space-y-1">
                  {productSearchResults.map((prod) => (
                    <button
                      key={prod._id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-start text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground line-clamp-1">
                          {prod.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          SKU: {prod.sku} · {prod.variants?.length || 0} variants
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                        Total: {prod.totalStock}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.productId && (
            <p className="text-[11px] text-destructive">
              {resolveError(errors.productId.message)}
            </p>
          )}
        </div>

        {/* Step 2: Select Variant (if manual product choice) */}
        {!selectedFromPreselect && selectedProduct && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              {t("inventory-adjust-select-variant") || "Select Variant"} *
            </Label>
            <Select
              value={selectedVariant?.sku ?? ""}
              onValueChange={(sku) => {
                const found = selectedProduct.variants.find((v) => v.sku === sku);
                setSelectedVariant(found || null);
                setValue("variantSku", found?.sku || "", { shouldValidate: true });
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue
                  placeholder={
                    t("inventory-adjust-variant-placeholder") ||
                    "Choose color and size..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectedProduct.variants.map((v, index) => (
                  <SelectItem key={v._id || `${v.sku}-${index}`} value={v.sku} className="text-xs">
                    {v.sku} — {v.color} / {v.size} (Current Stock: {v.stockQuantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.variantSku && (
              <p className="text-[11px] text-destructive">
                {resolveError(errors.variantSku.message)}
              </p>
            )}
          </div>
        )}

        {/* Preselected variant display */}
        {selectedFromPreselect && (
          <div className="rounded-lg border border-border/80 bg-muted/20 p-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t("inventory-target-variant") || "Target Variant:"}
            </span>
            <span className="font-semibold font-mono text-foreground">
              {activeVariantSku} ({activeVariantLabel})
            </span>
          </div>
        )}

        {/* Step 3: Adjustment Details (Type & Quantity) */}
        {activeVariantSku && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {t("inventory-adjust-type-label") || "Adjustment Type"} *
                </Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) =>
                        field.onChange(val as StockAdjustmentType)
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADJUSTMENT" className="text-xs">
                          {t("inventory-movement-ADJUSTMENT") || "Manual Adjustment"}
                        </SelectItem>
                        <SelectItem value="PURCHASE" className="text-xs">
                          {t("inventory-movement-PURCHASE") || "Purchase / Restock"}
                        </SelectItem>
                        <SelectItem value="SALE" className="text-xs">
                          {t("inventory-movement-SALE") || "Sale Deduction"}
                        </SelectItem>
                        <SelectItem value="RETURN" className="text-xs">
                          {t("inventory-movement-RETURN") || "Customer Return"}
                        </SelectItem>
                        <SelectItem value="DAMAGE" className="text-xs">
                          {t("inventory-movement-DAMAGE") || "Damaged / Defect"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {t("inventory-adjust-qty-label") || "Quantity Change"} *
                </Label>
                <Controller
                  control={control}
                  name="quantityChange"
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="1"
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? "" : parseInt(val, 10));
                      }}
                      placeholder={
                        t("inventory-adjust-qty-placeholder") ||
                        "e.g. +10 or -5"
                      }
                      className="h-9 text-xs font-mono"
                    />
                  )}
                />
                {errors.quantityChange && (
                  <p className="text-[11px] text-destructive">
                    {resolveError(errors.quantityChange.message)}
                  </p>
                )}
              </div>
            </div>

            {/* Stock Level Preview Card */}
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">
                  {t("inventory-adjust-preview-title") ||
                    "Stock Calculation Preview"}
                </span>
                <span className="text-[11px] text-muted-foreground italic">
                  {t("inventory-adjust-preview-warning") || "Atomically verified"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">
                    {t("inventory-adjust-preview-current") || "Current Stock"}
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {currentStock}
                  </span>
                </div>

                {/* Directional arrow with RTL flip */}
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0 rtl:rotate-180" />

                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">
                    {t("inventory-adjust-preview-change") || "Adjustment"}
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      parsedQuantityChange > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : parsedQuantityChange < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isQuantityValid
                      ? formatQuantityChange(parsedQuantityChange, locale)
                      : "0"}
                  </span>
                </div>

                {/* Directional arrow with RTL flip */}
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0 rtl:rotate-180" />

                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">
                    {t("inventory-adjust-preview-new") || "Expected Result"}
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      isNegativeStock
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {expectedStock}
                  </span>
                </div>
              </div>

              {isNegativeStock && (
                <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>
                    {t("inventory-adjust-insufficient-stock") ||
                      "Insufficient stock. Resulting stock cannot be less than 0."}
                  </span>
                </div>
              )}
            </div>

            {/* Step 4: Reason (Audit Requirement) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                {t("inventory-adjust-reason-label") || "Reason for Adjustment"} *
              </Label>
              <Controller
                control={control}
                name="reason"
                render={({ field }) => (
                  <Textarea
                    rows={3}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={
                      t("inventory-adjust-reason-placeholder") ||
                      "Explain why this adjustment is being made (audit requirement)..."
                    }
                    className="text-xs resize-none"
                  />
                )}
              />
              {errors.reason ? (
                <p className="text-[11px] text-destructive">
                  {resolveError(errors.reason.message)}
                </p>
              ) : watchedReason && watchedReason.trim().length < 3 ? (
                <p className="text-[11px] text-destructive">
                  {t("inventory-adjust-reason-min") ||
                    "Reason must be at least 3 characters long."}
                </p>
              ) : null}
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
            className="h-9 text-xs"
          >
            {t("inventory-adjust-cancel") || "Cancel"}
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={!canReview || isPending}
            className="h-9 gap-1.5 text-xs"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <SlidersHorizontal className="size-3.5" />
            )}
            <span>{t("inventory-adjust-btn-review") || "Review Adjustment"}</span>
          </Button>
        </div>
      </form>

      {/* Explicit Confirmation Alert Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-5 text-amber-500" />
              <span>
                {t("inventory-adjust-confirm-title") ||
                  "Confirm Stock Adjustment"}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1">
              {t("inventory-adjust-confirm-desc", {
                productName: activeProductName ?? "",
                variantSku: activeVariantSku ?? "",
                quantityChange: isQuantityValid
                  ? formatQuantityChange(parsedQuantityChange, locale)
                  : "0",
              }) ||
                `Are you sure you want to adjust stock for ${activeProductName} (${activeVariantSku}) by ${parsedQuantityChange}? This operation creates a permanent audit record.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Details summary */}
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-semibold">{activeProductName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU / Variant:</span>
              <span className="font-mono">{activeVariantSku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Stock:</span>
              <span className="font-mono">{currentStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity Change:</span>
              <span className="font-mono font-semibold">
                {isQuantityValid
                  ? formatQuantityChange(parsedQuantityChange, locale)
                  : "0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Expected Stock:</span>
              <span className="font-mono font-bold text-foreground">
                {expectedStock}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason:</span>
              <span className="italic max-w-[200px] truncate">{watchedReason}</span>
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending} className="h-9 text-xs">
              {t("inventory-adjust-cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmSubmit();
              }}
              disabled={isPending}
              className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin me-1.5" />
                  <span>{t("inventory-adjust-submitting") || "Applying..."}</span>
                </>
              ) : (
                <span>
                  {t("inventory-adjust-confirm-btn") ||
                    "Confirm & Apply Adjustment"}
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
