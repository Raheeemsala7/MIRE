"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  UsersRound,
  Users,
  RotateCcw,
  Globe,
  Shield,
  ChevronDown,
  Sparkles,
  UserCheck,
  ExternalLink,
  Bell,
  Activity,
  Package,
  BadgePercent,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/components/login/logout-button";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Separator } from "@/shared/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar";
import { can } from "@/lib/permissions/can";
import { PERMISSIONS } from "@/config/rbac.config";
import { getRoleBadgeVariant } from "@/features/employees/utils/employee.util";
import { hasPermission } from "@/lib/auth/roles";
import type { SafeUser } from "@/lib/auth/types";

interface AdminNavProps {
  currentUser: SafeUser | null;
  children: React.ReactNode;
}

export function AdminNav({ currentUser, children }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  const canViewEmployees = can(
    currentUser?.role,
    PERMISSIONS.EMPLOYEES_VIEW,
    currentUser?.permissions
  );

  const canViewCustomers = can(
    currentUser?.role,
    PERMISSIONS.CUSTOMERS_VIEW,
    currentUser?.permissions
  );

  const canViewReturns = can(
    currentUser?.role,
    PERMISSIONS.RETURNS_VIEW,
    currentUser?.permissions
  );

  const canViewProducts = can(
    currentUser?.role,
    PERMISSIONS.PRODUCTS_VIEW,
    currentUser?.permissions
  );

  const canViewBundles = can(
    currentUser?.role,
    PERMISSIONS.BUNDLES_VIEW,
    currentUser?.permissions
  );

  const navLinks = [
    {
      href: "/admin/dashboard",
      label: t("admin-nav-dashboard") || "Analytics Dashboard",
      icon: LayoutDashboard,
      active: pathname.startsWith("/admin/dashboard"),
      visible: hasPermission(currentUser, "dashboard:read"),
    },
    {
      href: "/admin/products",
      label: t("admin-nav-products") || (isAr ? "إدارة المنتجات" : "Products"),
      icon: Package,
      active: pathname.startsWith("/admin/products"),
      visible: canViewProducts,
    },
    {
      href: "/admin/bundles",
      label: t("admin-nav-bundles") || (isAr ? "الباقات والعروض" : "Bundles & Offers"),
      icon: BadgePercent,
      active: pathname.startsWith("/admin/bundles"),
      visible: canViewBundles,
    },
    {
      href: "/admin/returns",
      label: t("admin-nav-returns") || "Returns Management",
      icon: RotateCcw,
      active: pathname.startsWith("/admin/returns"),
      visible: canViewReturns,
    },
    {
      href: "/admin/customers",
      label: t("admin-nav-customers") || "Customers",
      icon: UsersRound,
      active: pathname.startsWith("/admin/customers"),
      visible: canViewCustomers,
    },
    {
      href: "/admin/employees",
      label: t("admin-nav-employees") || "Employees Management",
      icon: Users,
      active: pathname.startsWith("/admin/employees"),
      visible: canViewEmployees,
    },
  ].filter((item) => item.visible);

  function handleLanguageSwitch() {
    const nextLocale = isAr ? "en" : "ar";
    router.replace(pathname, { locale: nextLocale });
  }

  // Dynamic hierarchical breadcrumbs with parent links and child page tracking
  interface BreadcrumbSegment {
    label: string;
    href?: string;
  }

  const breadcrumbSegments: BreadcrumbSegment[] = React.useMemo(() => {
    const segments: BreadcrumbSegment[] = [];

    if (pathname.startsWith("/admin/bundles")) {
      const bundlesLabel = t("admin-nav-bundles") || (isAr ? "الباقات والعروض" : "Bundles & Offers");
      if (pathname === "/admin/bundles" || pathname === "/admin/bundles/") {
        segments.push({ label: bundlesLabel });
      } else if (pathname === "/admin/bundles/new") {
        segments.push({ label: bundlesLabel, href: "/admin/bundles" });
        segments.push({ label: t("admin-nav-add-bundle") || (isAr ? "إنشاء باقة جديدة" : "Create Bundle") });
      } else if (pathname.endsWith("/edit")) {
        segments.push({ label: bundlesLabel, href: "/admin/bundles" });
        segments.push({ label: t("admin-nav-edit-bundle") || (isAr ? "تعديل الباقة" : "Edit Bundle") });
      } else {
        segments.push({ label: bundlesLabel, href: "/admin/bundles" });
        segments.push({ label: t("admin-nav-bundle-details") || (isAr ? "تفاصيل الباقة" : "Bundle Details") });
      }
    } else if (pathname.startsWith("/admin/products")) {
      const productsLabel = t("admin-nav-products") || (isAr ? "إدارة المنتجات" : "Products");
      if (pathname === "/admin/products" || pathname === "/admin/products/") {
        segments.push({ label: productsLabel });
      } else if (pathname === "/admin/products/new") {
        segments.push({ label: productsLabel, href: "/admin/products" });
        segments.push({ label: t("admin-nav-add-product") || (isAr ? "إضافة منتج جديد" : "Add Product") });
      } else if (pathname.endsWith("/edit")) {
        segments.push({ label: productsLabel, href: "/admin/products" });
        segments.push({ label: t("admin-nav-edit-product") || (isAr ? "تعديل المنتج" : "Edit Product") });
      } else {
        segments.push({ label: productsLabel, href: "/admin/products" });
        segments.push({ label: t("admin-nav-product-details") || (isAr ? "تفاصيل المنتج" : "Product Details") });
      }
    } else if (pathname.startsWith("/admin/returns")) {
      const returnsLabel = t("admin-nav-returns") || (isAr ? "إدارة المرتجعات" : "Returns Management");
      if (pathname === "/admin/returns" || pathname === "/admin/returns/") {
        segments.push({ label: returnsLabel });
      } else {
        segments.push({ label: returnsLabel, href: "/admin/returns" });
        segments.push({ label: t("admin-nav-return-details") || (isAr ? "تفاصيل المرتجع" : "Return Details") });
      }
    } else if (pathname.startsWith("/admin/customers")) {
      const customersLabel = t("admin-nav-customers") || (isAr ? "إدارة العملاء" : "Customers");
      if (pathname === "/admin/customers" || pathname === "/admin/customers/") {
        segments.push({ label: customersLabel });
      } else {
        segments.push({ label: customersLabel, href: "/admin/customers" });
        segments.push({ label: t("admin-nav-customer-profile") || (isAr ? "ملف العميل" : "Customer Profile") });
      }
    } else if (pathname.startsWith("/admin/employees")) {
      const employeesLabel = t("admin-nav-employees") || (isAr ? "إدارة الموظفين" : "Employees Management");
      if (pathname === "/admin/employees" || pathname === "/admin/employees/") {
        segments.push({ label: employeesLabel });
      } else {
        segments.push({ label: employeesLabel, href: "/admin/employees" });
        segments.push({ label: t("admin-nav-employee-profile") || (isAr ? "ملف الموظف" : "Employee Profile") });
      }
    } else {
      segments.push({
        label: t("admin-nav-dashboard") || (isAr ? "لوحة مؤشرات الأداء" : "Analytics Dashboard"),
      });
    }

    return segments;
  }, [pathname, t, isAr]);

  const userInitial = currentUser?.name?.charAt(0)?.toUpperCase() || (isAr ? "م" : "A");

  return (
    <SidebarProvider defaultOpen>
      {/* Official shadcn Sidebar (collapsible="icon" with automatic RTL start/end mirroring) */}
      <Sidebar
        collapsible="icon"
        side="left"
        className="border-border/60 bg-card/60 backdrop-blur-xs"
      >
        {/* Sidebar Header: Brand & Admin badge */}
        <SidebarHeader className="border-b border-border/60 p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip={{ children: "MIRÉ Admin", side: isAr ? "left" : "right" }}
                className="hover:bg-accent/50 data-[state=open]:hover:bg-accent group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:mx-auto"
              >
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2.5 group/brand"
                >
                  {/* Monogram emblem - perfectly centered size-8 in collapsed mode */}
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-serif font-bold text-base shadow-xs select-none transition-transform group-hover/brand:scale-105">
                    M
                  </div>

                  {/* Brand text & badge - hidden when collapsed */}
                  <div className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="font-serif text-lg tracking-[.15em] text-foreground font-semibold leading-none">
                      MIRÉ
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-sans tracking-normal py-0 px-1.5 font-normal shrink-0"
                    >
                      Admin
                    </Badge>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Sidebar Content: Navigation Groups & Links */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
              {t("admin-nav-section-manage") || "Management"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={link.active}
                        tooltip={{ children: link.label, side: isAr ? "left" : "right" }}
                        className={`transition-colors ${
                          link.active
                            ? "bg-primary text-primary-foreground font-medium shadow-xs"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <Link href={link.href}>
                          <Icon className="size-4 shrink-0" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar Footer: User Card, Permissions, and Brand Version */}
        <SidebarFooter className="group-data-[collapsible=icon]:p-2">
          {currentUser && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-2 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Avatar className="size-8 border border-border shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-semibold text-foreground truncate block">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {currentUser.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/40 group-data-[collapsible=icon]:hidden">
                <Badge
                  variant={getRoleBadgeVariant(currentUser.role)}
                  className="text-[10px] py-0 px-1.5 font-normal"
                >
                  {currentUser.role}
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Shield className="size-3" />
                  <span>{currentUser.permissions?.length || 0}</span>
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 group-data-[collapsible=icon]:hidden text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <Sparkles className="size-3 text-primary" />
              MIRÉ v1.0
            </span>
            <LogoutButton />
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main Layout Area using official SidebarInset */}
      <SidebarInset className="flex flex-col min-h-screen bg-muted/10 overflow-hidden">
        {/* Top Header Bar (shadcn dashboard-01 style) */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card/60 px-4 sm:px-6 backdrop-blur-md">
          {/* Left: SidebarTrigger + Separator + Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="text-xs">
                    <Link href="/admin/dashboard">
                      {t("admin-nav-admin")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbSegments.map((seg, idx) => {
                  const isLast = idx === breadcrumbSegments.length - 1;
                  const itemKey = `${seg.label}-${seg.href || "current"}`;
                  return (
                    <React.Fragment key={itemKey}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {seg.href && !isLast ? (
                          <BreadcrumbLink asChild className="text-xs">
                            <Link href={seg.href}>{seg.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="text-xs font-medium">
                            {seg.label}
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right: View Website + Notifications + Language switch + User profile dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-2.5 text-xs gap-1.5 border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <a
                href={`/${locale}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="size-3.5 text-primary" />
                <span className="hidden sm:inline">
                  {t("admin-nav-view-website") || (isAr ? "عرض الموقع" : "View Website")}
                </span>
                <ExternalLink className="size-3 opacity-60 hidden sm:inline" />
              </a>
            </Button>

            {/* Notifications Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative size-8 rounded-full border-border/60 hover:bg-accent cursor-pointer"
                  aria-label={t("admin-nav-notifications")}
                >
                  <Bell className="size-3.5 text-muted-foreground" />
                  <span className="absolute top-1.5 end-1.5 size-1.5 rounded-full bg-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between p-3 pb-2 text-xs font-semibold">
                  <span>{t("admin-nav-notifications-title")}</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                    {t("admin-nav-notifications-live")}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2 text-xs">
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>{t("admin-nav-notif-system-title")}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {t("admin-nav-notif-system-desc")}
                    </p>
                  </div>
                  <Link
                    href="/admin/returns"
                    className="block rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1 hover:bg-accent/50 hover:border-border transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-foreground group-hover:text-primary transition-colors">
                        <Activity className="size-3 text-primary" />
                        <span>{t("admin-nav-notif-returns-title")}</span>
                      </div>
                      <ExternalLink className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {t("admin-nav-notif-returns-desc")}
                    </p>
                  </Link>
                  <Link
                    href="/admin/employees"
                    className="block rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1 hover:bg-accent/50 hover:border-border transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-foreground group-hover:text-primary transition-colors">
                        <Shield className="size-3 text-primary" />
                        <span>{t("admin-nav-notif-security-title")}</span>
                      </div>
                      <ExternalLink className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {t("admin-nav-notif-security-desc")}
                    </p>
                  </Link>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2 text-center text-[10px] text-muted-foreground font-mono">
                  {t("admin-nav-notif-view-all")}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLanguageSwitch}
              className="h-8 px-2.5 text-xs gap-1.5 border-border/60"
            >
              <Globe className="size-3.5" />
              <span className="text-[11px] font-medium font-mono uppercase">
                {isAr ? "EN" : "عربي"}
              </span>
            </Button>

            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 h-8 px-2 rounded-full border border-border/60 hover:bg-accent"
                  >
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium hidden md:inline-block max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  {/* User Profile Info Header */}
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-none text-foreground truncate">
                            {currentUser.name}
                          </p>
                          <p className="text-[11px] leading-none text-muted-foreground truncate mt-0.5">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-border/40">
                        <Badge variant={getRoleBadgeVariant(currentUser.role)} className="text-[10px] py-0 px-1.5">
                          {currentUser.role}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Shield className="size-3" />
                          <span>{currentUser.permissions?.length || 0} {t("admin-nav-permissions")}</span>
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Account / Session details — NOT repeating sidebar links */}
                  <DropdownMenuItem
                    onClick={handleLanguageSwitch}
                    className="text-xs cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <span>{isAr ? t("admin-nav-switch-to-en") : t("admin-nav-switch-to-ar")}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      {isAr ? "EN" : "AR"}
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem disabled className="text-xs flex items-center gap-2 text-muted-foreground">
                    <UserCheck className="size-3.5" />
                    <span>{t("admin-nav-verified")}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Logout Button */}
                  <div className="p-2 flex justify-end">
                    <LogoutButton />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
