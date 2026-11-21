"use client";

import * as React from "react";
import Image from "next/image";
import { useForm, useFieldArray, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  Check,
  Star,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Layers,
  DollarSign,
  Palette,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  createProductSchema,
  PRODUCT_SIZES,
  PRODUCT_STATUSES,
  MAX_PRODUCT_IMAGES,
  type CreateProductInput,
  type UpdateProductInput,
} from "../../schemas/product.schema";
import { generateVariantSku } from "../../utils/product.util";
import { useCreateProduct } from "../../hooks/use-create-product";
import { useUpdateProduct } from "../../hooks/use-update-product";
import type { Product, CategoryItem, ProductSize } from "../../types/product.types";

interface ProductFormProps {
  categories: CategoryItem[];
  initialProduct?: Product;
  isEditMode?: boolean;
}

// Focused subcomponent for rendering an individual image row
function ImageRow({
  control,
  index,
  isPrimary,
  canRemove,
  onSetPrimary,
  onRemove,
  primaryLabel,
  setPrimaryLabel,
}: {
  control: Control<CreateProductInput>;
  index: number;
  isPrimary: boolean;
  canRemove: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
  primaryLabel: string;
  setPrimaryLabel: string;
}) {
  const currentUrl = useWatch({
    control,
    name: `images.${index}.url`,
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
      <div className="relative size-14 rounded-md overflow-hidden border border-border/80 bg-muted/50 shrink-0">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt={`Product Image ${index + 1}`}
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>

      <div className="flex-1 w-full">
        <FormField
          control={control}
          name={`images.${index}.url`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  className="text-xs h-9 font-mono"
                  dir="ltr"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant={isPrimary ? "default" : "outline"}
          size="sm"
          onClick={onSetPrimary}
          className="text-xs h-8 gap-1.5"
        >
          <Star className={`size-3 ${isPrimary ? "fill-current" : ""}`} />
          <span>{isPrimary ? primaryLabel : setPrimaryLabel}</span>
        </Button>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="size-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Focused subcomponent for rendering color row
function ColorRow({
  control,
  index,
  canRemove,
  onRemove,
  colorNamePlaceholder,
}: {
  control: Control<CreateProductInput>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  colorNamePlaceholder: string;
}) {
  const colorHex = useWatch({
    control,
    name: `colors.${index}.code`,
  }) || "#000000";

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20">
      <div
        className="size-7 rounded-full border border-border shrink-0 shadow-xs"
        style={{ backgroundColor: colorHex }}
      />

      <FormField
        control={control}
        name={`colors.${index}.name`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input
                placeholder={colorNamePlaceholder}
                className="text-xs h-8"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`colors.${index}.code`}
        render={({ field }) => (
          <FormItem className="w-24">
            <FormControl>
              <Input
                placeholder="#000000"
                className="text-xs h-8 font-mono"
                dir="ltr"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="size-8 text-destructive hover:bg-destructive/10 shrink-0"
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

// Focused subcomponent for rendering variant row
function VariantRow({
  control,
  index,
  availableColors,
  canRemove,
  onRemove,
  skuLabel,
  colorLabel,
  sizeLabel,
  stockLabel,
  priceOverrideLabel,
}: {
  control: Control<CreateProductInput>;
  index: number;
  availableColors: Array<{ name: string; code: string }>;
  canRemove: boolean;
  onRemove: () => void;
  skuLabel: string;
  colorLabel: string;
  sizeLabel: string;
  stockLabel: string;
  priceOverrideLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/20 items-end">
      {/* Variant SKU */}
      <div className="sm:col-span-2">
        <FormField
          control={control}
          name={`variants.${index}.sku`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] text-muted-foreground">
                {skuLabel} *
              </FormLabel>
              <FormControl>
                <Input
                  className="text-xs h-8 font-mono uppercase"
                  dir="ltr"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      {/* Color Selection */}
      <div>
        <FormField
          control={control}
          name={`variants.${index}.color`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] text-muted-foreground">
                {colorLabel} *
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableColors.map((c, i) => (
                    <SelectItem
                      key={`${c.name}-${i}`}
                      value={c.name}
                      className="text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2.5 rounded-full inline-block"
                          style={{ backgroundColor: c.code }}
                        />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {!availableColors.some((c) => c.name === field.value) && (
                    <SelectItem value={field.value} className="text-xs">
                      {field.value}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      {/* Size Selection */}
      <div>
        <FormField
          control={control}
          name={`variants.${index}.size`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] text-muted-foreground">
                {sizeLabel} *
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={(val) => field.onChange(val as ProductSize)}
              >
                <FormControl>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRODUCT_SIZES.map((sz) => (
                    <SelectItem key={sz} value={sz} className="text-xs">
                      {sz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      {/* Stock Quantity */}
      <div>
        <FormField
          control={control}
          name={`variants.${index}.stockQuantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] text-muted-foreground">
                {stockLabel} *
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  className="text-xs h-8 font-mono"
                  dir="ltr"
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      {/* Price Override & Delete */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1">
          <FormField
            control={control}
            name={`variants.${index}.priceOverride`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] text-muted-foreground truncate">
                  {priceOverrideLabel}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="-"
                    className="text-xs h-8 font-mono"
                    dir="ltr"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="size-8 text-destructive hover:bg-destructive/10 shrink-0 self-end mb-0.5"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProductForm({
  categories,
  initialProduct,
  isEditMode = false,
}: ProductFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";

  const [activeTab, setActiveTab] = React.useState<"basic" | "pricing" | "images" | "variants">("basic");

  // Derive initial form values
  const defaultValues: CreateProductInput = React.useMemo(() => {
    if (initialProduct) {
      const catId =
        typeof initialProduct.category === "object" && initialProduct.category !== null
          ? initialProduct.category._id
          : String(initialProduct.category || "");

      return {
        name: initialProduct.name || "",
        sku: initialProduct.sku || "",
        description: initialProduct.description || "",
        category: catId,
        brand: initialProduct.brand || "MIRE",
        price: initialProduct.price || 0,
        discountPrice: initialProduct.discountPrice || null,
        images: initialProduct.images?.length
          ? initialProduct.images.map((img) => ({
              url: img.url,
              publicId: img.publicId || "",
              isPrimary: Boolean(img.isPrimary),
            }))
          : [{ url: "", isPrimary: true }],
        colors: initialProduct.colors?.length
          ? initialProduct.colors.map((c) => ({
              name: c.name,
              code: c.code,
              image: c.image || "",
            }))
          : [{ name: "Standard", code: "#18181b" }],
        sizes: initialProduct.sizes?.length
          ? (initialProduct.sizes as CreateProductInput["sizes"])
          : ["S", "M", "L"],
        variants: initialProduct.variants?.length
          ? initialProduct.variants.map((v) => ({
              sku: v.sku,
              color: v.color,
              size: v.size,
              stockQuantity: v.stockQuantity ?? 0,
              priceOverride: v.priceOverride ?? null,
            }))
          : [
              {
                sku: `${initialProduct.sku || "MIRE-PROD"}-S`,
                color: "Standard",
                size: "S",
                stockQuantity: 10,
                priceOverride: null,
              },
            ],
        lowStockThreshold: initialProduct.lowStockThreshold || 5,
        status: initialProduct.status || "ACTIVE",
        isFeatured: Boolean(initialProduct.isFeatured),
        isNewArrival: initialProduct.isNewArrival ?? true,
        isBestSeller: Boolean(initialProduct.isBestSeller),
        tags: initialProduct.tags || [],
      };
    }

    return {
      name: "",
      sku: "",
      description: "",
      category: categories[0]?._id || "",
      brand: "MIRE",
      price: 0,
      discountPrice: null,
      images: [
        {
          url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80",
          isPrimary: true,
        },
      ],
      colors: [
        {
          name: "Blush Pink",
          code: "#fbcfe8",
        },
      ],
      sizes: ["S", "M", "L"],
      variants: [
        {
          sku: "MIRE-DRS-001-BP-S",
          color: "Blush Pink",
          size: "S",
          stockQuantity: 15,
          priceOverride: null,
        },
        {
          sku: "MIRE-DRS-001-BP-M",
          color: "Blush Pink",
          size: "M",
          stockQuantity: 10,
          priceOverride: null,
        },
      ],
      lowStockThreshold: 5,
      status: "ACTIVE",
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      tags: [],
    };
  }, [initialProduct, categories]);

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues,
    mode: "onBlur",
  });

  // Dynamic field arrays
  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const {
    fields: colorFields,
    append: appendColor,
    remove: removeColor,
  } = useFieldArray({
    control: form.control,
    name: "colors",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // Mutations
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct(
    () => {
      router.push("/admin/products");
    }
  );

  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct(
    initialProduct?._id || "",
    () => {
      router.push("/admin/products");
    }
  );

  const isSubmitting = isCreating || isUpdating;

  // Local state for tags input string
  const [tagsInput, setTagsInput] = React.useState(
    (defaultValues.tags || []).join(", ")
  );

  function handleTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTagsInput(val);
    const parsed = val
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    form.setValue("tags", parsed, { shouldValidate: true });
  }

  // Handle setting primary image
  function handleSetPrimaryImage(index: number) {
    const currentImages = form.getValues("images");
    const updated = currentImages.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    form.setValue("images", updated, { shouldValidate: true });
  }

  // Auto-generate SKUs for variants based on current Base SKU, color, and size
  function handleAutoGenerateSkus() {
    const baseSku = form.getValues("sku") || "MIRE-PROD";
    const currentVariants = form.getValues("variants");
    const updated = currentVariants.map((v) => ({
      ...v,
      sku: generateVariantSku(baseSku, v.color, v.size),
    }));
    form.setValue("variants", updated, { shouldValidate: true });
  }

  // Watch colors at the parent level once
  const watchedColors = useWatch({
    control: form.control,
    name: "colors",
  }) || [];

  const watchedImages = useWatch({
    control: form.control,
    name: "images",
  }) || [];

  // Tab error indicators derived from form errors
  const errors = form.formState.errors;
  const basicHasError = Boolean(
    errors.name ||
    errors.sku ||
    errors.category ||
    errors.brand ||
    errors.description ||
    errors.status
  );
  const pricingHasError = Boolean(
    errors.price ||
    errors.discountPrice ||
    errors.lowStockThreshold ||
    errors.tags
  );
  const imagesHasError = Boolean(errors.images);
  const variantsHasError = Boolean(
    errors.variants ||
    errors.colors ||
    errors.sizes
  );

  function onSubmit(values: CreateProductInput) {
    if (isEditMode && initialProduct?._id) {
      const updatePayload: UpdateProductInput = {};
      const initialCatId =
        typeof initialProduct.category === "object" && initialProduct.category !== null
          ? initialProduct.category._id
          : String(initialProduct.category || "");

      if (values.name !== initialProduct.name) updatePayload.name = values.name;
      if (values.sku !== initialProduct.sku) updatePayload.sku = values.sku;
      if (values.description !== initialProduct.description) updatePayload.description = values.description;
      if (values.category !== initialCatId) updatePayload.category = values.category;
      if (values.brand !== initialProduct.brand) updatePayload.brand = values.brand;
      if (values.price !== initialProduct.price) updatePayload.price = values.price;
      if (values.discountPrice !== initialProduct.discountPrice) {
        updatePayload.discountPrice = values.discountPrice ?? null;
      }
      if (values.status !== initialProduct.status) updatePayload.status = values.status;
      if (values.lowStockThreshold !== initialProduct.lowStockThreshold) {
        updatePayload.lowStockThreshold = values.lowStockThreshold;
      }
      if (values.isFeatured !== initialProduct.isFeatured) updatePayload.isFeatured = values.isFeatured;
      if (values.isNewArrival !== initialProduct.isNewArrival) updatePayload.isNewArrival = values.isNewArrival;
      if (values.isBestSeller !== initialProduct.isBestSeller) updatePayload.isBestSeller = values.isBestSeller;

      // Ensure clean image objects matching backend contract
      updatePayload.images = values.images.map(({ url, publicId, isPrimary }) => ({
        url,
        ...(publicId ? { publicId } : {}),
        ...(isPrimary !== undefined ? { isPrimary } : {}),
      }));
      updatePayload.colors = values.colors;
      updatePayload.sizes = values.sizes;
      updatePayload.variants = values.variants;
      updatePayload.tags = values.tags;

      updateProduct(updatePayload);
    } else {
      createProduct(values);
    }
  }

  function onInvalid(validationErrors: FieldErrors<CreateProductInput>) {
    // Switch to the first tab containing an error so the user can address it immediately
    if (
      validationErrors.name ||
      validationErrors.sku ||
      validationErrors.category ||
      validationErrors.brand ||
      validationErrors.description ||
      validationErrors.status
    ) {
      setActiveTab("basic");
    } else if (
      validationErrors.price ||
      validationErrors.discountPrice ||
      validationErrors.lowStockThreshold ||
      validationErrors.tags
    ) {
      setActiveTab("pricing");
    } else if (validationErrors.images) {
      setActiveTab("images");
    } else if (
      validationErrors.variants ||
      validationErrors.colors ||
      validationErrors.sizes
    ) {
      setActiveTab("variants");
    }

    toast.error(
      t("product-form-fix-errors") || "Please fix validation errors before saving"
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {/* Navigation / Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              asChild
              className="size-8 rounded-lg"
            >
              <Link href="/admin/products">
                {isAr ? (
                  <ArrowRight className="size-4" />
                ) : (
                  <ArrowLeft className="size-4" />
                )}
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                {isEditMode
                  ? t("product-edit-title")
                  : t("product-create-title")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isEditMode
                  ? t("product-edit-subtitle")
                  : t("product-create-subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={isSubmitting}
              className="text-xs"
            >
              <Link href="/admin/products">{t("product-form-cancel")}</Link>
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs gap-1.5 min-w-[110px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{t("product-form-saving")}</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>{t("product-form-save")}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabbed Form Sections with Active State & Error Indicators */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as typeof activeTab)}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/60 border border-border/60 rounded-xl">
            <TabsTrigger
              value="basic"
              className="text-xs py-2 gap-1.5 data-[state=active]:bg-card relative"
            >
              <Layers className="size-3.5" />
              <span>{t("product-form-tab-basic")}</span>
              {basicHasError && (
                <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="text-xs py-2 gap-1.5 data-[state=active]:bg-card relative"
            >
              <DollarSign className="size-3.5" />
              <span>{t("product-form-tab-pricing")}</span>
              {pricingHasError && (
                <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="text-xs py-2 gap-1.5 data-[state=active]:bg-card relative"
            >
              <ImageIcon className="size-3.5" />
              <span>{t("product-form-tab-images")}</span>
              {imagesHasError && (
                <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="variants"
              className="text-xs py-2 gap-1.5 data-[state=active]:bg-card relative"
            >
              <Palette className="size-3.5" />
              <span>{t("product-form-tab-variants")}</span>
              {variantsHasError && (
                <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: BASIC INFORMATION ─── */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {t("product-form-tab-basic")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("product-create-subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("product-form-name-label")} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("product-form-name-placeholder")}
                            className="text-xs h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  {/* Base SKU */}
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("product-form-sku-label")} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("product-form-sku-placeholder")}
                            className="text-xs h-9 font-mono uppercase"
                            dir="ltr"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("product-form-category-label")} *
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="text-xs h-9">
                              <SelectValue placeholder={t("product-form-category-placeholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c._id} value={c._id} className="text-xs">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  {/* Brand */}
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("product-form-brand-label")}
                        </FormLabel>
                        <FormControl>
                          <Input className="text-xs h-9" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("product-form-status-label")}
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="text-xs h-9">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCT_STATUSES.map((st) => (
                              <SelectItem key={st} value={st} className="text-xs">
                                {st}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {t("product-form-desc-label")} *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder={t("product-form-desc-placeholder")}
                          className="text-xs resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 2: PRICING & FLAGS ─── */}
          <TabsContent value="pricing" className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {t("product-form-tab-pricing")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("product-form-desc-placeholder")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Regular Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("product-form-price-label")} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            className="text-xs h-9 font-mono"
                            dir="ltr"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  {/* Discount Price */}
                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("product-form-discount-label")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            className="text-xs h-9 font-mono"
                            dir="ltr"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? null : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  {/* Low Stock Alert Threshold */}
                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("product-form-threshold-label")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            className="text-xs h-9 font-mono"
                            dir="ltr"
                            {...field}
                            value={field.value || 5}
                            onChange={(e) => field.onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags input */}
                <div>
                  <FormLabel className="text-xs">
                    {t("product-form-tags-label")}
                  </FormLabel>
                  <Input
                    type="text"
                    value={tagsInput}
                    onChange={handleTagsChange}
                    placeholder={t("product-form-tags-placeholder")}
                    className="text-xs h-9 mt-1.5"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Separate tags with commas.
                  </p>
                </div>

                {/* Promotional Switches */}
                <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t border-border/40">
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                        <div className="space-y-0.5 pe-2">
                          <FormLabel className="text-xs font-medium cursor-pointer">
                            {t("product-form-featured-label")}
                          </FormLabel>
                          <FormDescription className="text-[10px] leading-tight">
                            {t("product-form-featured-desc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isNewArrival"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                        <div className="space-y-0.5 pe-2">
                          <FormLabel className="text-xs font-medium cursor-pointer">
                            {t("product-form-new-label")}
                          </FormLabel>
                          <FormDescription className="text-[10px] leading-tight">
                            {t("product-form-new-desc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isBestSeller"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                        <div className="space-y-0.5 pe-2">
                          <FormLabel className="text-xs font-medium cursor-pointer">
                            {t("product-form-bestseller-label")}
                          </FormLabel>
                          <FormDescription className="text-[10px] leading-tight">
                            {t("product-form-bestseller-desc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 3: IMAGES ─── */}
          <TabsContent value="images" className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {t("product-form-images-title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("product-form-images-desc")}
                  </CardDescription>
                </div>
                {imageFields.length < MAX_PRODUCT_IMAGES && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendImage({
                        url: "",
                        isPrimary: imageFields.length === 0,
                      })
                    }
                    className="text-xs gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    <span>{t("product-form-images-add")}</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {imageFields.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-lg text-xs text-muted-foreground">
                    {t("product-form-images-empty")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {imageFields.map((fieldItem, index) => {
                      const isPrimary = Boolean(watchedImages[index]?.isPrimary);

                      return (
                        <ImageRow
                          key={fieldItem.id}
                          control={form.control}
                          index={index}
                          isPrimary={isPrimary}
                          canRemove={imageFields.length > 1}
                          onSetPrimary={() => handleSetPrimaryImage(index)}
                          onRemove={() => removeImage(index)}
                          primaryLabel={t("product-form-images-primary")}
                          setPrimaryLabel={t("product-form-images-set-primary")}
                        />
                      );
                    })}
                  </div>
                )}
                {form.formState.errors.images?.message && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.images.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 4: VARIANTS & COLORS ─── */}
          <TabsContent value="variants" className="space-y-6">
            {/* Colors Section */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {t("product-form-colors-title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("product-form-colors-desc")}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendColor({
                      name: "New Color",
                      code: "#000000",
                    })
                  }
                  className="text-xs gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>{t("product-form-colors-add")}</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {colorFields.map((item, index) => (
                    <ColorRow
                      key={item.id}
                      control={form.control}
                      index={index}
                      canRemove={colorFields.length > 1}
                      onRemove={() => removeColor(index)}
                      colorNamePlaceholder={t("product-form-colors-name")}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Variants Matrix */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {t("product-form-variants-title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("product-form-variants-desc")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoGenerateSkus}
                    className="text-xs gap-1.5"
                  >
                    <Sparkles className="size-3.5 text-primary" />
                    <span>{t("product-form-variants-auto-sku")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const firstColor = form.getValues("colors")?.[0]?.name || "Standard";
                      appendVariant({
                        sku: `${form.getValues("sku") || "MIRE"}-VAR-${variantFields.length + 1}`,
                        color: firstColor,
                        size: "M",
                        stockQuantity: 10,
                        priceOverride: null,
                      });
                    }}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    <span>{t("product-form-variants-add")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {variantFields.map((item, index) => (
                    <VariantRow
                      key={item.id}
                      control={form.control}
                      index={index}
                      availableColors={watchedColors}
                      canRemove={variantFields.length > 1}
                      onRemove={() => removeVariant(index)}
                      skuLabel={t("product-form-variants-col-sku")}
                      colorLabel={t("product-form-variants-col-color")}
                      sizeLabel={t("product-form-variants-col-size")}
                      stockLabel={t("product-form-variants-col-stock")}
                      priceOverrideLabel={t("product-form-variants-col-price")}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
