"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  FolderTree,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { CategoryParentSelector } from "./category-parent-selector";
import { CategoryImageField } from "./category-image-field";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "../schemas/category.schema";
import type { CategoryItem } from "../types/category.types";
import {
  createCategoryAction,
  updateCategoryAction,
} from "../apis/categories.action";
import { getParentCategoryId } from "../utils/category.util";

interface CategoryFormProps {
  initialCategory?: CategoryItem | null;
  categories: CategoryItem[];
  defaultParentId?: string;
  locale: string;
}

export function CategoryForm({
  initialCategory,
  categories,
  defaultParentId,
  locale,
}: CategoryFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isAr = locale === "ar";
  const isEdit = Boolean(initialCategory);

  const initialParentId = initialCategory
    ? getParentCategoryId(initialCategory)
    : defaultParentId || null;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialCategory?.name || "",
      slug: initialCategory?.slug || "",
      description: initialCategory?.description || "",
      image: {
        url: initialCategory?.image?.url || "",
        publicId: initialCategory?.image?.publicId || "",
      },
      parentCategory: initialParentId,
      isActive: initialCategory?.isActive ?? true,
      sortOrder: initialCategory?.sortOrder ?? 0,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const watchedName = watch("name");

  // Auto-slug generation for new categories
  React.useEffect(() => {
    if (!isEdit && watchedName) {
      const generated = watchedName
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", generated, { shouldValidate: false });
    }
  }, [watchedName, isEdit, setValue]);

  async function onSubmit(values: CategoryFormValues) {
    try {
      setIsSubmitting(true);

      if (isEdit && initialCategory) {
        const res = await updateCategoryAction(initialCategory._id, values);
        if (res.success) {
          toast.success(t("category-form-success-update"));
          router.push("/admin/categories");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update category");
        }
      } else {
        const res = await createCategoryAction(values);
        if (res.success) {
          toast.success(t("category-form-success-create"));
          router.push("/admin/categories");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to create category");
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/categories")}
            className="size-9 rounded-lg"
          >
            <BackIcon className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FolderTree className="size-5 text-primary" />
              {isEdit
                ? t("category-form-edit-title")
                : t("category-form-create-title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? t("category-form-edit-desc")
                : t("category-form-create-desc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/categories")}
            disabled={isSubmitting}
          >
            {t("category-form-cancel")}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="gap-2 font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t("category-form-saving")}
              </>
            ) : isEdit ? (
              t("category-form-submit-edit")
            ) : (
              t("category-form-submit-create")
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Essential details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                {t("category-form-section-general-title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("category-form-section-general-desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <Label htmlFor="category-name" className="text-sm font-medium">
                  {t("category-form-name-label")} *
                </Label>
                <Input
                  id="category-name"
                  {...register("name")}
                  placeholder={t("category-form-name-placeholder")}
                  disabled={isSubmitting}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-destructive font-medium">
                    {t(errors.name.message as string) || errors.name.message}
                  </p>
                )}
              </div>

              {/* Category Slug */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category-slug" className="text-sm font-medium">
                    {t("category-form-slug-label")}
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    /categories/{watch("slug") || "..."}
                  </span>
                </div>
                <Input
                  id="category-slug"
                  {...register("slug")}
                  placeholder="e.g. evening-dresses"
                  disabled={isSubmitting}
                  className="font-mono text-xs"
                  dir="ltr"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("category-form-slug-desc")}
                </p>
                {errors.slug && (
                  <p className="text-xs text-destructive font-medium">
                    {t(errors.slug.message as string) || errors.slug.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="category-desc" className="text-sm font-medium">
                  {t("category-form-desc-label")}
                </Label>
                <Textarea
                  id="category-desc"
                  {...register("description")}
                  placeholder={t("category-form-desc-placeholder")}
                  rows={4}
                  disabled={isSubmitting}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && (
                  <p className="text-xs text-destructive font-medium">
                    {t(errors.description.message as string) || errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media / Image Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {t("category-form-section-media-title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("category-form-section-media-desc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="image.url"
                render={({ field }) => (
                  <CategoryImageField
                    value={field.value}
                    onChange={(url) => field.onChange(url)}
                    error={errors.image?.url?.message ? (t(errors.image.url.message) || errors.image.url.message) : undefined}
                    disabled={isSubmitting}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Hierarchy & Organization (1 col) */}
        <div className="space-y-6">
          {/* Hierarchy Placement Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                {t("category-form-section-hierarchy-title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("category-form-section-hierarchy-desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={control}
                name="parentCategory"
                render={({ field }) => (
                  <CategoryParentSelector
                    categories={categories}
                    currentCategoryId={initialCategory?._id}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    disabled={isSubmitting}
                  />
                )}
              />

              {/* Sort Order */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <Label htmlFor="category-sortOrder" className="text-sm font-medium">
                  {t("category-form-sort-label")}
                </Label>
                <Input
                  id="category-sortOrder"
                  type="number"
                  min={0}
                  {...register("sortOrder", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="w-full font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("category-form-sort-desc")}
                </p>
                {errors.sortOrder && (
                  <p className="text-xs text-destructive font-medium">
                    {t(errors.sortOrder.message as string) || errors.sortOrder.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visibility & Status Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {t("category-form-section-visibility-title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("category-form-section-visibility-desc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="category-active" className="text-sm font-medium cursor-pointer">
                        {t("category-form-status-label")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {field.value
                          ? t("category-form-status-active")
                          : t("category-form-status-inactive")}
                      </p>
                    </div>
                    <Switch
                      id="category-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
