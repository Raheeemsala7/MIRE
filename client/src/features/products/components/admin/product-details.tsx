"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Edit2,
  Archive,
  ExternalLink,
  Layers,
  Sparkles,
  PackageCheck,
  Calendar,
  Tag,
  DollarSign,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/components/ui/table";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  formatCurrency,
  formatProductDate,
  getProductStockStatus,
  getProductStatusBadgeVariant,
  getPrimaryImageUrl,
} from "../../utils/product.util";
import { ArchiveProductDialog } from "./archive-product-dialog";
import type { Product } from "../../types/product.types";
import type { SafeUser } from "@/lib/auth/types";

interface ProductDetailsProps {
  product: Product;
  currentUser: SafeUser | null;
}

export function ProductDetails({ product, currentUser }: ProductDetailsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const [selectedImage, setSelectedImage] = React.useState(
    getPrimaryImageUrl(product.images)
  );
  const [isArchiveOpen, setIsArchiveOpen] = React.useState(false);

  const canUpdate = can(
    currentUser?.role,
    PERMISSIONS.PRODUCTS_UPDATE,
    currentUser?.permissions
  );

  const canArchive = can(
    currentUser?.role,
    PERMISSIONS.PRODUCTS_ARCHIVE,
    currentUser?.permissions
  );

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? product.category.name
      : String(product.category || "-");

  const stockStatus = getProductStockStatus(product);

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Button
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                {product.name}
              </h1>
              <Badge
                variant={getProductStatusBadgeVariant(product.status)}
                className="text-[10px] font-normal"
              >
                {product.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">
              SKU: {product.sku} · Slug: /{product.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs gap-1.5"
          >
            <a
              href={`/${locale}/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3.5" />
              <span>{t("products-action-storefront")}</span>
            </a>
          </Button>

          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs gap-1.5"
            >
              <Link href={`/admin/products/${product._id}/edit`}>
                <Edit2 className="size-3.5" />
                <span>{t("products-action-edit")}</span>
              </Link>
            </Button>
          )}

          {canArchive && product.status !== "ARCHIVED" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsArchiveOpen(true)}
              className="text-xs gap-1.5"
            >
              <Archive className="size-3.5" />
              <span>{t("products-action-archive")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Gallery + Core Info */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs overflow-hidden">
            <div className="relative aspect-4/3 w-full bg-muted/40">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
                unoptimized
              />
            </div>
          </Card>

          {/* Thumbnails row */}
          {product.images?.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative size-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === img.url
                      ? "border-primary shadow-xs"
                      : "border-border/60 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                  {img.isPrimary && (
                    <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-primary-foreground text-[8px] py-0.5 text-center font-bold">
                      PRIMARY
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing, Inventory & Metadata */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>{t("product-details-overview")}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {product.brand}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing section */}
              <div className="flex items-baseline gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <DollarSign className="size-5 text-primary shrink-0 self-center" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    {product.discountPrice ? (
                      <>
                        <span className="text-2xl font-bold font-mono text-foreground">
                          {formatCurrency(product.discountPrice, locale)}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground line-through">
                          {formatCurrency(product.price, locale)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold font-mono text-foreground">
                        {formatCurrency(product.price, locale)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tax inclusive retail price
                  </p>
                </div>

                <Badge variant="outline" className="text-xs font-normal">
                  {categoryName}
                </Badge>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("product-form-desc-label")}
                </span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Badges / Flags */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                {product.isFeatured && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Sparkles className="size-3 text-amber-500" />
                    <span>Featured</span>
                  </Badge>
                )}
                {product.isNewArrival && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <PackageCheck className="size-3 text-emerald-500" />
                    <span>New Arrival</span>
                  </Badge>
                )}
                {product.isBestSeller && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Sparkles className="size-3 text-primary" />
                    <span>Best Seller</span>
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <Tag className="size-3.5 text-muted-foreground" />
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Audit Dates */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-3 border-t border-border/40">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  <span>Added: {formatProductDate(product.createdAt, locale)}</span>
                </span>
                <span>Updated: {formatProductDate(product.updatedAt, locale)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Variants Breakdown Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>{t("product-details-inventory-breakdown")}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total stock: <strong className="text-foreground">{product.totalStock}</strong> units across{" "}
              {product.variants?.length || 0} variant combinations.
            </p>
          </div>
          <Badge
            variant={stockStatus === "OUT_OF_STOCK" ? "destructive" : "secondary"}
            className="text-xs"
          >
            {stockStatus}
          </Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs">Variant SKU</TableHead>
                <TableHead className="text-xs">Color</TableHead>
                <TableHead className="text-xs">Size</TableHead>
                <TableHead className="text-xs">Available Stock</TableHead>
                <TableHead className="text-xs">Price Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants?.length ? (
                product.variants.map((v, i) => (
                  <TableRow key={v.sku || i} className="border-border/40">
                    <TableCell className="font-mono text-xs font-semibold text-foreground" dir="ltr">
                      {v.sku}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{v.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        {v.size}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-foreground" dir="ltr">
                      {v.stockQuantity}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground" dir="ltr">
                      {v.priceOverride
                        ? formatCurrency(v.priceOverride, locale)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-xs text-muted-foreground"
                  >
                    No variants registered for this product.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Archive Dialog */}
      <ArchiveProductDialog
        product={product}
        open={isArchiveOpen}
        onOpenChange={setIsArchiveOpen}
        onSuccess={() => {
          setIsArchiveOpen(false);
          router.push("/admin/products");
          router.refresh();
        }}
      />
    </div>
  );
}
