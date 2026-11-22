"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  DollarSign,
  Gift,
  Percent,
  Layers,
  Sparkles,
  Calendar,
  Check,
  Package,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import {
  createBundleSchema,
  type CreateBundleInput,
} from "../schemas/bundle.schema";
import { useCreateBundle } from "../hooks/use-create-bundle";
import { useUpdateBundle } from "../hooks/use-update-bundle";
import { ProductPicker } from "./product-picker";
import type { Bundle, BundleType } from "../types/bundle.types";
import type { CategoryItem, Product } from "@/features/products";
import { formatBundleCurrency } from "../utils/bundle.util";

interface BundleFormProps {
  categories: CategoryItem[];
  initialProducts?: Product[];
  initialBundle?: Bundle;
  isEditMode?: boolean;
}

// Helper to convert Date to local datetime string for HTML datetime-local inputs without timezone offset shift
function toDateTimeLocalString(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function BundleForm({
  categories,
  initialProducts = [],
  initialBundle,
  isEditMode = false,
}: BundleFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";

  // Prepopulate dates preserving local timezone representation
  const defaultStartDate = React.useMemo(() => {
    if (initialBundle?.startDate) {
      const d = new Date(initialBundle.startDate);
      return !isNaN(d.getTime()) ? toDateTimeLocalString(d) : "";
    }
    return toDateTimeLocalString(new Date());
  }, [initialBundle]);

  const defaultEndDate = React.useMemo(() => {
    if (initialBundle?.endDate) {
      const d = new Date(initialBundle.endDate);
      return !isNaN(d.getTime()) ? toDateTimeLocalString(d) : "";
    }
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    return toDateTimeLocalString(nextMonth);
  }, [initialBundle]);

  // Merge initialProducts with bundle's already-populated eligible products so names/prices are preserved
  const combinedInitialProducts = React.useMemo(() => {
    const list: Product[] = [...initialProducts];
    const existingIds = new Set(list.map((p) => p._id));
    if (initialBundle?.eligibleProducts) {
      for (const p of initialBundle.eligibleProducts) {
        if (typeof p === "object" && p !== null && "_id" in p) {
          if (!existingIds.has(p._id)) {
            list.push(p as unknown as Product);
            existingIds.add(p._id);
          }
        }
      }
    }
    return list;
  }, [initialProducts, initialBundle]);

  // Extract initial product IDs
  const initialProductIds = React.useMemo(() => {
    if (!initialBundle?.eligibleProducts) return [];
    return initialBundle.eligibleProducts
      .map((p) => (typeof p === "object" && p !== null ? p._id : String(p)))
      .filter(Boolean);
  }, [initialBundle]);

  // Extract initial category IDs
  const initialCategoryIds = React.useMemo(() => {
    if (!initialBundle?.eligibleCategories) return [];
    return initialBundle.eligibleCategories
      .map((c) => (typeof c === "object" && c !== null ? c._id : String(c)))
      .filter(Boolean);
  }, [initialBundle]);

  const form = useForm<CreateBundleInput>({
    resolver: zodResolver(createBundleSchema),
    defaultValues: {
      title: initialBundle?.title || "",
      description: initialBundle?.description || "",
      type: initialBundle?.type || "FIXED_PRICE",
      eligibleProducts: initialProductIds,
      eligibleCategories: initialCategoryIds,
      requiredQuantity: initialBundle?.requiredQuantity ?? 2,
      freeQuantity: initialBundle?.freeQuantity ?? 0,
      bundlePrice: initialBundle?.bundlePrice ?? null,
      discountPercentage: initialBundle?.discountPercentage ?? null,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      usageLimit: initialBundle?.usageLimit ?? null,
      maxUsesPerCustomer: initialBundle?.maxUsesPerCustomer ?? 1,
      isActive: initialBundle?.isActive ?? true,
      bannerImage: initialBundle?.bannerImage || "",
    },
  });

  const { isSubmitting } = form.formState;

  // Mutations
  const { mutate: createBundle, isPending: isCreating } = useCreateBundle(() => {
    router.push("/admin/bundles");
  });

  const { mutate: updateBundle, isPending: isUpdating } = useUpdateBundle(
    initialBundle?._id || "",
    () => {
      router.push(`/admin/bundles/${initialBundle?._id}`);
    }
  );

  const isPending = isCreating || isUpdating || isSubmitting;

  // Watch form fields for dynamic rule UI
  const watchedType = useWatch({ control: form.control, name: "type" });
  const watchedRequiredQty = useWatch({ control: form.control, name: "requiredQuantity" });
  const watchedFreeQty = useWatch({ control: form.control, name: "freeQuantity" });
  const watchedPrice = useWatch({ control: form.control, name: "bundlePrice" });
  const watchedPercentage = useWatch({ control: form.control, name: "discountPercentage" });
  const watchedProductIds = useWatch({ control: form.control, name: "eligibleProducts" }) || [];
  const watchedCategoryIds = useWatch({ control: form.control, name: "eligibleCategories" }) || [];

  function onSubmit(values: CreateBundleInput) {
    // Convert date strings to standard ISO strings
    const payload: CreateBundleInput = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      freeQuantity: values.type === "BUY_X_GET_Y" ? Number(values.freeQuantity) || 1 : 0,
      bundlePrice:
        values.type === "FIXED_PRICE" || values.type === "COLLECTION_PICK"
          ? Number(values.bundlePrice) || 0
          : null,
      discountPercentage:
        values.type === "PERCENTAGE" ? Number(values.discountPercentage) || 0 : null,
      eligibleProducts: (values.eligibleProducts || []).filter(
        (id) => Boolean(id && typeof id === "string" && id.trim().length === 24)
      ),
      eligibleCategories: (values.eligibleCategories || []).filter(
        (id) => Boolean(id && typeof id === "string" && id.trim().length === 24)
      ),
    };

    if (isEditMode && initialBundle?._id) {
      updateBundle(payload);
    } else {
      createBundle(payload);
    }
  }

  // Type Selector Cards
  const offerTypes: Array<{
    type: BundleType;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      type: "FIXED_PRICE",
      label: t("bundle-type-fixed-price") || "Fixed Price Bundle",
      desc: t("bundle-type-fixed-desc") || "e.g. 2 items for 599 EGP",
      icon: DollarSign,
    },
    {
      type: "BUY_X_GET_Y",
      label: t("bundle-type-buy-x-get-y") || "Buy X Get Y (BOGO)",
      desc: t("bundle-type-bogo-desc") || "e.g. Buy 2 Get 1 Free",
      icon: Gift,
    },
    {
      type: "PERCENTAGE",
      label: t("bundle-type-percentage") || "Percentage Discount",
      desc: t("bundle-type-percent-desc") || "e.g. 25% off when buying 3 items",
      icon: Percent,
    },
    {
      type: "COLLECTION_PICK",
      label: t("bundle-type-collection-pick") || "Collection Pick",
      desc: t("bundle-type-collection-desc") || "Pick any X items for fixed price",
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Link href={isEditMode && initialBundle ? `/admin/bundles/${initialBundle._id}` : "/admin/bundles"}>
              {isAr ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground font-serif sm:text-2xl">
              {isEditMode
                ? t("bundle-form-edit-title") || "Edit Bundle & Offer"
                : t("bundle-form-create-title") || "Create Bundle or Promotion"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditMode
                ? `${t("bundle-form-edit-subtitle") || "Update promotion rules and products for"} ${initialBundle?.title}`
                : t("bundle-form-create-subtitle") ||
                  "Configure promotional pricing, item quantities, eligibility, and scheduling."}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Promotion Type Selection */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>{t("bundle-step-type-title") || "1. Select Offer Type"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t("bundle-step-type-desc") ||
                  "Choose the promotion mechanism supported by the store promotion engine."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {offerTypes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = watchedType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        form.setValue("type", item.type);
                        if (item.type === "BUY_X_GET_Y" && (!watchedFreeQty || watchedFreeQty < 1)) {
                          form.setValue("freeQuantity", 1);
                        }
                      }}
                      className={`flex flex-col items-start p-3.5 rounded-lg border text-start transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary shadow-xs"
                          : "border-border/70 hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          className={`p-2 rounded-md ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="size-4" />
                        </div>
                        {isSelected && (
                          <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="size-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Basic Offer Details */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <span>{t("bundle-step-details-title") || "2. Offer Information"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{t("bundle-field-title") || "Offer Title *"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("bundle-field-title-placeholder") || "e.g. Elegant Abaya Ramadan Bundle"}
                        className="text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      {t("bundle-field-title-desc") || "Customer-facing promotional name."}
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{t("bundle-field-description") || "Description"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          t("bundle-field-description-placeholder") ||
                          "Explain offer details, combination rules, or terms..."
                        }
                        rows={2}
                        className="text-xs resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bannerImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {t("bundle-field-banner-image") || "Banner Image URL (Optional)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/promotions/bundle-banner.jpg"
                        className="text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Step 3: Eligible Products & Categories (Reusing Product Infrastructure) */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>{t("bundle-step-scope-title") || "3. Product & Category Eligibility"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t("bundle-step-scope-desc") ||
                  "Select specific products and/or entire categories eligible for this promotion."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              {/* Product Picker Component */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">
                  {t("bundle-step-scope-select-products") || "Select Eligible Products"}
                </label>
                <ProductPicker
                  selectedProductIds={watchedProductIds}
                  onSelectionChange={(ids) => form.setValue("eligibleProducts", ids)}
                  categories={categories}
                  initialProducts={combinedInitialProducts}
                />
              </div>

              {/* Category Eligibility Checkbox Chips */}
              {categories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="text-xs font-medium text-foreground block">
                    {t("bundle-step-scope-categories-label") || "Or Eligible Categories (Optional)"}
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    {t("bundle-step-scope-categories-desc") ||
                      "Any product belonging to selected categories will qualify for the bundle."}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {categories.map((cat) => {
                      const isCatSelected = watchedCategoryIds.includes(cat._id);
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => {
                            if (isCatSelected) {
                              form.setValue(
                                "eligibleCategories",
                                watchedCategoryIds.filter((id) => id !== cat._id)
                              );
                            } else {
                              form.setValue("eligibleCategories", [...watchedCategoryIds, cat._id]);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            isCatSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/40 text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {isCatSelected && <Check className="size-3" />}
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 4: Pricing & Discount Rules */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                <span>{t("bundle-step-pricing-title") || "4. Pricing & Discount Rules"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Required Quantity */}
                <FormField
                  control={form.control}
                  name="requiredQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {watchedType === "BUY_X_GET_Y"
                          ? t("bundle-field-buy-qty") || "Buy Quantity (X) *"
                          : t("bundle-field-required-qty") || "Required Quantity *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          dir="ltr"
                          className="text-xs font-mono"
                          value={field.value ?? 1}
                          onChange={(e) => field.onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        {watchedType === "BUY_X_GET_Y"
                          ? t("bundle-field-buy-qty-desc") || "Number of items customer must buy."
                          : t("bundle-field-required-qty-desc") || "Items needed in cart to activate offer."}
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Free Quantity (BOGO only) */}
                {watchedType === "BUY_X_GET_Y" && (
                  <FormField
                    control={form.control}
                    name="freeQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("bundle-field-free-qty") || "Free Quantity (Y) *"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            dir="ltr"
                            className="text-xs font-mono"
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          {t("bundle-field-free-qty-desc") ||
                            "Number of items given for free (lowest-priced item in cart)."}
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Fixed Bundle Price */}
                {(watchedType === "FIXED_PRICE" || watchedType === "COLLECTION_PICK") && (
                  <FormField
                    control={form.control}
                    name="bundlePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("bundle-field-bundle-price") || "Fixed Bundle Price (EGP) *"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            dir="ltr"
                            placeholder="599"
                            className="text-xs font-mono"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? null : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          {t("bundle-field-bundle-price-desc") ||
                            "Total fixed price charged for the required quantity."}
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Discount Percentage */}
                {watchedType === "PERCENTAGE" && (
                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("bundle-field-discount-percentage") || "Discount Percentage (%) *"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            dir="ltr"
                            placeholder="20"
                            className="text-xs font-mono"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? null : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          {t("bundle-field-discount-percentage-desc") ||
                            "Percentage discount deducted from qualifying items."}
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Live Rule Summary Display */}
              <div className="p-3 rounded-md bg-primary/5 border border-primary/20 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t("bundle-summary-live-rule") || "Customer Offer Preview:"}
                </span>
                <span className="text-xs font-bold text-primary">
                  {watchedType === "FIXED_PRICE" &&
                    `${t("bundle-rule-for-qty") || "Buy"} ${watchedRequiredQty || 2} ${t("bundle-rule-items") || "items for"} ${formatBundleCurrency(watchedPrice, locale)}`}
                  {watchedType === "BUY_X_GET_Y" &&
                    `${t("bundle-rule-buy") || "Buy"} ${watchedRequiredQty || 2} + ${t("bundle-rule-get") || "Get"} ${watchedFreeQty || 1} ${t("bundle-rule-free") || "Free"}`}
                  {watchedType === "PERCENTAGE" &&
                    `${watchedPercentage || 0}% ${t("bundle-rule-off") || "OFF when buying"} ${watchedRequiredQty || 1} ${t("bundle-rule-items") || "items"}`}
                  {watchedType === "COLLECTION_PICK" &&
                    `${t("bundle-rule-pick-any") || "Pick any"} ${watchedRequiredQty || 2} ${t("bundle-rule-items") || "items for"} ${formatBundleCurrency(watchedPrice, locale)}`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Schedule & Restrictions */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <span>{t("bundle-step-schedule-title") || "5. Schedule & Redemption Limits"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{t("bundle-field-start-date") || "Start Date & Time *"}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" dir="ltr" className="text-xs font-mono" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{t("bundle-field-end-date") || "End Date & Time *"}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" dir="ltr" className="text-xs font-mono" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {t("bundle-field-usage-limit") || "Total Redemptions Limit (Optional)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          dir="ltr"
                          placeholder={t("bundle-field-usage-limit-placeholder") || "Unlimited if empty"}
                          className="text-xs font-mono"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxUsesPerCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {t("bundle-field-max-per-customer") || "Max Uses Per Customer *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          dir="ltr"
                          className="text-xs font-mono"
                          value={field.value ?? 1}
                          onChange={(e) => field.onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="pt-2 border-t border-border/40">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-semibold text-foreground">
                          {t("bundle-field-active-toggle") || "Offer Active Status"}
                        </FormLabel>
                        <FormDescription className="text-[11px]">
                          {t("bundle-field-active-desc") ||
                            "When enabled, the offer will be active immediately within its valid date range."}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              asChild
              className="text-xs"
            >
              <Link href="/admin/bundles">{t("bundle-btn-cancel") || "Cancel"}</Link>
            </Button>

            <Button type="submit" disabled={isPending} className="text-xs gap-1.5 min-w-[140px]">
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>
                {isPending
                  ? t("bundle-btn-saving") || "Saving..."
                  : isEditMode
                  ? t("bundle-btn-update") || "Update Offer"
                  : t("bundle-btn-save") || "Save & Launch Offer"}
              </span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
