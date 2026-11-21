"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  Power,
  Calendar,
  Layers,
  Package,
  DollarSign,
  Users,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import type { Bundle, BundleProductSummary, BundleCategorySummary } from "../types/bundle.types";
import {
  getBundleStatus,
  getBundleStatusBadgeConfig,
  getBundleTypeLabelKey,
  formatBundleCurrency,
  formatBundleDate,
} from "../utils/bundle.util";
import { useToggleBundleStatus } from "../hooks/use-toggle-bundle-status";
import { DeleteBundleDialog } from "./delete-bundle-dialog";
import type { SafeUser } from "@/lib/auth/types";
import type { Product, CategoryItem } from "@/features/products";

interface BundleDetailsProps {
  bundle: Bundle;
  currentUser: SafeUser | null;
}

export function BundleDetails({ bundle, currentUser }: BundleDetailsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const canEdit = can(
    currentUser?.role,
    PERMISSIONS.BUNDLES_UPDATE,
    currentUser?.permissions
  );

  const canDelete = can(
    currentUser?.role,
    PERMISSIONS.BUNDLES_DELETE,
    currentUser?.permissions
  );

  const { mutate: toggleStatus, isPending: isToggling } = useToggleBundleStatus(() => {
    router.refresh();
  });

  const status = getBundleStatus(bundle);
  const badgeConfig = getBundleStatusBadgeConfig(status);

  // Parse products
  const products: (BundleProductSummary | Product)[] = Array.isArray(bundle.eligibleProducts)
    ? (bundle.eligibleProducts.filter(
        (p) => typeof p === "object" && p !== null
      ) as (BundleProductSummary | Product)[])
    : [];

  // Parse categories
  const categories: (BundleCategorySummary | CategoryItem)[] = Array.isArray(bundle.eligibleCategories)
    ? (bundle.eligibleCategories.filter(
        (c) => typeof c === "object" && c !== null
      ) as (BundleCategorySummary | CategoryItem)[])
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <Link href="/admin/bundles">
                {isAr ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
              {bundle.title}
            </h1>
            <Badge
              variant={badgeConfig.variant}
              className={`text-xs px-2.5 py-0.5 ${badgeConfig.className}`}
            >
              {t(badgeConfig.labelKey)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono ps-10">
            <span dir="ltr">/{bundle.slug}</span> • {t(getBundleTypeLabelKey(bundle.type))}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto ps-10 sm:ps-0">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              disabled={isToggling}
              onClick={() => toggleStatus({ id: bundle._id, isActive: !bundle.isActive })}
              className="text-xs gap-1.5 h-9"
            >
              <Power
                className={`size-3.5 ${
                  bundle.isActive ? "text-amber-500" : "text-emerald-500"
                }`}
              />
              <span>
                {bundle.isActive
                  ? t("bundle-action-deactivate") || "Deactivate"
                  : t("bundle-action-activate") || "Activate"}
              </span>
            </Button>
          )}

          {canEdit && (
            <Button asChild size="sm" className="text-xs gap-1.5 h-9">
              <Link href={`/admin/bundles/${bundle._id}/edit`}>
                <Edit className="size-3.5" />
                <span>{t("bundle-action-edit") || "Edit Offer"}</span>
              </Link>
            </Button>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-xs gap-1.5 h-9"
            >
              <Trash2 className="size-3.5" />
              <span>{t("bundle-action-delete") || "Delete"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Description Banner if available */}
      {bundle.description && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground me-1.5">
              {t("bundle-details-desc-label") || "Offer Description"}:
            </span>
            {bundle.description}
          </CardContent>
        </Card>
      )}

      {/* Grid of Key Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Offer Rule & Pricing */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="size-4 text-primary" />
              <span>{t("bundle-details-card-pricing") || "Pricing & Discount Rule"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">{t("bundle-details-type") || "Type"}</span>
              <Badge variant="outline" className="text-[10px]">
                {t(getBundleTypeLabelKey(bundle.type))}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">
                {t("bundle-details-required-qty") || "Required Quantity"}
              </span>
              <span className="font-bold text-foreground font-mono">
                {bundle.requiredQuantity} {t("bundle-rule-items") || "items"}
              </span>
            </div>

            {bundle.freeQuantity > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">
                  {t("bundle-details-free-qty") || "Free Items"}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {bundle.freeQuantity} {t("bundle-rule-free") || "Free"}
                </span>
              </div>
            )}

            {bundle.bundlePrice !== null && (
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">
                  {t("bundle-details-fixed-price") || "Fixed Bundle Price"}
                </span>
                <span className="font-bold text-foreground font-mono text-sm">
                  {formatBundleCurrency(bundle.bundlePrice, locale)}
                </span>
              </div>
            )}

            {bundle.discountPercentage !== null && (
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">
                  {t("bundle-details-discount-percent") || "Discount"}
                </span>
                <span className="font-bold text-primary font-mono text-sm">
                  {bundle.discountPercentage}% OFF
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Scheduling & Window */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span>{t("bundle-details-card-schedule") || "Schedule & Validity"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">{t("bundle-details-start-date") || "Starts"}</span>
              <span className="font-medium text-foreground">
                {formatBundleDate(bundle.startDate, locale, true)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">{t("bundle-details-end-date") || "Ends"}</span>
              <span className="font-medium text-foreground">
                {formatBundleDate(bundle.endDate, locale, true)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">{t("bundle-details-status") || "Status"}</span>
              <Badge variant={badgeConfig.variant} className={`text-[10px] ${badgeConfig.className}`}>
                {t(badgeConfig.labelKey)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Limits & Redemptions */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>{t("bundle-details-card-limits") || "Usage & Restrictions"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">
                {t("bundle-details-usage-limit") || "Total Redemptions Limit"}
              </span>
              <span className="font-medium text-foreground font-mono">
                {bundle.usageLimit ?? t("bundle-limit-unlimited") ?? "Unlimited"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">
                {t("bundle-details-used-count") || "Used Redemptions"}
              </span>
              <span className="font-bold text-foreground font-mono">
                {bundle.usedCount ?? 0}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">
                {t("bundle-details-max-per-customer") || "Max per Customer"}
              </span>
              <span className="font-medium text-foreground font-mono">
                {bundle.maxUsesPerCustomer ?? 1}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eligible Products Section */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
        <CardHeader className="border-b border-border/60 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="size-4 text-primary" />
              <span>{t("bundle-details-eligible-products") || "Eligible Products"}</span>
              <Badge variant="secondary" className="text-xs font-mono">
                {products.length}
              </Badge>
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {products.length === 0
              ? t("bundle-details-no-products-restriction") ||
                "No individual products restricted. Offer applies to any product in eligible categories or the entire catalog."
              : t("bundle-details-products-desc") ||
                "Only the following products qualify for this bundle offer."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {t("bundle-details-empty-products") || "Applies broadly to entire eligible catalog."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">
                    {t("bundle-details-col-product") || "Product"}
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    {t("bundle-details-col-sku") || "SKU"}
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    {t("bundle-details-col-price") || "Price"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((prod) => {
                  const primaryImage =
                    prod.images?.find((img) => img.isPrimary)?.url ||
                    prod.images?.[0]?.url;

                  return (
                    <TableRow key={prod._id} className="border-border/40">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="relative size-10 rounded-md overflow-hidden bg-muted/60 border border-border/80 shrink-0">
                            {primaryImage ? (
                              <Image
                                src={primaryImage}
                                alt={prod.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="size-full flex items-center justify-center text-muted-foreground">
                                <Package className="size-4" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {prod.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5 font-mono text-xs text-muted-foreground" dir="ltr">
                        {prod.sku}
                      </TableCell>

                      <TableCell className="py-2.5 text-xs font-medium font-mono">
                        {formatBundleCurrency(prod.price, locale)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Eligible Categories Section */}
      {categories.length > 0 && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
          <CardHeader className="py-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>{t("bundle-details-eligible-categories") || "Eligible Categories"}</span>
              <Badge variant="secondary" className="text-xs font-mono">
                {categories.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat._id}
                  variant="outline"
                  className="text-xs px-2.5 py-1 bg-muted/30"
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteBundleDialog
        bundle={bundle}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={() => {
          router.push("/admin/bundles");
        }}
      />
    </div>
  );
}
