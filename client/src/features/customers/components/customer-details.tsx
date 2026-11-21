"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Tag,
  FileText,
  MapPin,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Share2,
  UserCheck,
  UserX,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import {
  formatCustomerDate,
  formatCustomerCurrency,
} from "../utils/customer.util";
import { CustomerOrdersTable } from "./customer-orders-table";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { useCustomer } from "../hooks/use-customer";
import type { Customer, CustomerRecentOrder } from "../types/customer.types";
import type { SafeUser } from "@/lib/auth/types";

interface CustomerDetailsProps {
  customer: Customer;
  recentOrders: CustomerRecentOrder[];
  currentUser: SafeUser | null;
  locale: string;
}

export function CustomerDetails({
  customer: initialCustomer,
  recentOrders: initialRecentOrders,
  currentUser,
  locale,
}: CustomerDetailsProps) {
  // Translation
  const t = useTranslations();

  // State
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTab, setEditTab] = React.useState<"profile" | "tags" | "notes">("profile");

  // Queries
  const { data: customerQueryData } = useCustomer(initialCustomer._id, {
    success: true,
    statusCode: 200,
    message: "Initial",
    data: {
      customer: initialCustomer,
      recentOrders: initialRecentOrders,
    },
  });

  // Variables
  const customer = customerQueryData?.data?.customer ?? initialCustomer;
  const recentOrders = customerQueryData?.data?.recentOrders ?? initialRecentOrders;

  const canEdit = can(
    currentUser?.role,
    PERMISSIONS.CUSTOMERS_UPDATE,
    currentUser?.permissions
  );

  const aov =
    customer.totalOrders > 0
      ? Math.round(customer.totalSpent / customer.totalOrders)
      : 0;

  const isUserLinked = Boolean(customer.user);

  // Functions
  function openEdit(tab: "profile" | "tags" | "notes") {
    setEditTab(tab);
    setEditOpen(true);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back to list */}
      <div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" />
          <span>{t("customers-back-to-list") || "Back to Customers"}</span>
        </Link>
      </div>

      {/* Main Identity Card */}
      <Card className="border border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-6 border-b border-border/60">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif font-bold text-primary text-2xl uppercase">
              {customer.fullName?.charAt(0) || "C"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  {customer.fullName}
                </h2>
                {isUserLinked ? (
                  <Badge variant="default" className="text-[11px] gap-1">
                    <UserCheck className="size-3" />
                    <span>{t("customers-badge-registered") || "Store Account"}</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    <UserX className="size-3" />
                    <span>{t("customers-badge-guest") || "Direct Customer"}</span>
                  </Badge>
                )}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                ID: {customer._id}
              </p>
            </div>
          </div>

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEdit("profile")}
              className="h-9 gap-1.5 text-xs"
            >
              <Edit2 className="size-3.5" />
              <span>{t("customers-action-edit-profile") || "Edit Details"}</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Email */}
            <div className="flex items-start gap-2.5">
              <Mail className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  {t("customers-col-email") || "Email Address"}
                </span>
                <span className="text-xs font-medium text-foreground truncate block">
                  {customer.email || "—"}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-2.5">
              <Phone className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  {t("customers-col-phone") || "Phone Number"}
                </span>
                <span dir="ltr" className="text-xs font-mono font-medium text-foreground block">
                  {customer.phone}
                </span>
                {customer.secondaryPhone && (
                  <span dir="ltr" className="text-[11px] font-mono text-muted-foreground block">
                    {customer.secondaryPhone}
                  </span>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start gap-2.5">
              <Calendar className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  {t("customers-col-registered") || "Registration Date"}
                </span>
                <span className="text-xs font-medium text-foreground block">
                  {formatCustomerDate(customer.createdAt, locale)}
                </span>
              </div>
            </div>

            {/* Saved Addresses Count */}
            <div className="flex items-start gap-2.5">
              <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  {t("customers-col-addresses") || "Addresses"}
                </span>
                <span className="text-xs font-medium text-foreground block">
                  {customer.addresses?.length ?? 0}{" "}
                  {t("customers-saved-addresses-count") || "saved locations"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Orders */}
        <Card className="border border-border/60 bg-card/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("customers-kpi-orders") || "Total Orders"}
              </span>
              <span className="inline-flex rounded-lg p-2 bg-primary/10 text-primary">
                <ShoppingBag className="size-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                {customer.totalOrders ?? 0}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("customers-kpi-orders-desc") || "Completed & active purchases"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="border border-border/60 bg-card/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("customers-kpi-spent") || "Lifetime Value"}
              </span>
              <span className="inline-flex rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="size-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                {formatCustomerCurrency(customer.totalSpent, locale)}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("customers-kpi-spent-desc") || "Cumulative historical spending"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="border border-border/60 bg-card/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("customers-kpi-aov") || "Average Order Value"}
              </span>
              <span className="inline-flex rounded-lg p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <TrendingUp className="size-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                {formatCustomerCurrency(aov, locale)}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("customers-kpi-aov-desc") || "Average revenue per order"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Orders & Addresses (left) + Tags & Notes & Social (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Orders and Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <CustomerOrdersTable orders={recentOrders} />

          {/* Delivery Addresses */}
          <Card className="border border-border/60 overflow-hidden">
            <CardHeader className="p-5 border-b border-border/60 bg-card/60">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <CardTitle className="font-serif text-lg font-semibold text-foreground">
                  {t("customers-addresses-title") || "Delivery Addresses"}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {!customer.addresses || customer.addresses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("customers-addresses-empty") || "No addresses recorded on file."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customer.addresses.map((addr, idx) => (
                    <div
                      key={addr._id || idx}
                      className="p-3.5 rounded-lg border border-border/60 bg-background/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {addr.city}, {addr.governorate}
                        </span>
                        {addr.isDefault && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {t("customers-address-default") || "Default"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {addr.street}
                        {addr.building ? `, Building ${addr.building}` : ""}
                        {addr.apartment ? `, Apt ${addr.apartment}` : ""}
                      </p>
                      {addr.landmark && (
                        <p className="text-[11px] text-muted-foreground/80">
                          <span className="font-medium">Landmark:</span> {addr.landmark}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground/80">
                        {addr.country || "Egypt"}
                        {addr.postalCode ? ` • ${addr.postalCode}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span): Tags, Internal Notes, Social Profiles */}
        <div className="space-y-6">
          {/* Customer Tags Card */}
          <Card className="border border-border/60 overflow-hidden">
            <CardHeader className="p-5 border-b border-border/60 bg-card/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <CardTitle className="font-serif text-base font-semibold text-foreground">
                  {t("customers-tags-title") || "Customer Tags"}
                </CardTitle>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit("tags")}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("customers-action-manage") || "Manage"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5">
              {!customer.tags || customer.tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("customers-tags-none") || "No tags assigned to this customer."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {customer.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs px-2.5 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes Card */}
          <Card className="border border-border/60 overflow-hidden">
            <CardHeader className="p-5 border-b border-border/60 bg-card/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <CardTitle className="font-serif text-base font-semibold text-foreground">
                  {t("customers-notes-title") || "Internal Staff Notes"}
                </CardTitle>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit("notes")}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("customers-action-edit") || "Edit"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5">
              {customer.notes ? (
                <div className="rounded-md bg-muted/40 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {customer.notes}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("customers-notes-empty") ||
                    "No internal notes logged. Click edit to add delivery preferences or staff remarks."}
                </p>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground/75">
                {t("customers-notes-confidential") ||
                  "Confidential: Notes are never exposed to customer-facing channels."}
              </p>
            </CardContent>
          </Card>

          {/* Social Profiles Card */}
          <Card className="border border-border/60 overflow-hidden">
            <CardHeader className="p-5 border-b border-border/60 bg-card/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="size-4 text-primary" />
                <CardTitle className="font-serif text-base font-semibold text-foreground">
                  {t("customers-social-title") || "Social Profiles"}
                </CardTitle>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit("profile")}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("customers-action-edit") || "Edit"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {/* WhatsApp */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">WhatsApp</span>
                {customer.socialProfiles?.whatsapp ? (
                  <a
                    href={`https://wa.me/${customer.socialProfiles.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span dir="ltr">{customer.socialProfiles.whatsapp}</span>
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Instagram</span>
                {customer.socialProfiles?.instagram ? (
                  <a
                    href={`https://instagram.com/${customer.socialProfiles.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{customer.socialProfiles.instagram}</span>
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              {/* Facebook */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Facebook</span>
                {customer.socialProfiles?.facebook ? (
                  <span className="text-foreground truncate max-w-[150px]">
                    {customer.socialProfiles.facebook}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        initialTab={editTab}
      />
    </div>
  );
}
