"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  UsersRound,
  Users,
  RotateCcw,
  Menu,
  X,
  Globe,
  Shield,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/components/login/logout-button";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile drawer when navigating
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

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

  const navLinks = [
    {
      href: "/admin/dashboard",
      label: t("admin-nav-dashboard") || "Analytics Dashboard",
      icon: LayoutDashboard,
      active: pathname.startsWith("/admin/dashboard"),
      visible: hasPermission(currentUser, "dashboard:read"),
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

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 z-50 w-72 bg-card p-6 shadow-xl transition-transform duration-200 ease-in-out flex flex-col justify-between ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <Link
              href="/admin/dashboard"
              className="font-serif text-2xl tracking-[.15em] text-ds-text-primary"
            >
              MIRÉ{" "}
              <span className="ms-2 font-sans text-xs tracking-normal text-ds-text-muted">
                Admin
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="size-8 p-0"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* User info badge */}
          {currentUser && (
            <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                  {currentUser.name}
                </span>
                <Badge
                  variant={getRoleBadgeVariant(currentUser.role)}
                  className="text-[10px]"
                >
                  {currentUser.role}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground block truncate">
                {currentUser.email}
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                    link.active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-border/60 space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLanguageSwitch}
            className="w-full text-xs justify-start"
          >
            <Globe className="size-3.5 mr-2 rtl:ml-2 rtl:mr-0" />
            <span>Switch Language / تغيير اللغة</span>
          </Button>
          <div className="flex justify-end">
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (Persistent / Fixed - does not scroll) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen border-r border-ds-border-subtle bg-card/60 backdrop-blur-xs p-6 justify-between rtl:border-r-0 rtl:border-l overflow-y-auto">
        <div className="space-y-6">
          {/* Brand header */}
          <div className="border-b border-border/60 pb-5">
            <Link
              href="/admin/dashboard"
              className="font-serif text-2xl tracking-[.15em] text-ds-text-primary block"
            >
              MIRÉ{" "}
              <span className="ms-2 font-sans text-xs tracking-normal text-ds-text-muted">
                Admin
              </span>
            </Link>
          </div>

          {/* User info badge */}
          {currentUser && (
            <div className="rounded-lg border border-border/60 bg-background/50 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 font-serif font-bold text-primary text-xs uppercase">
                  {currentUser.name.charAt(0) || "A"}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground truncate block">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {currentUser.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Shield className="size-3" />
                  <span>{t("admin-role-badge") || "Role"}</span>
                </span>
                <Badge
                  variant={getRoleBadgeVariant(currentUser.role)}
                  className="text-[10px] py-0 px-1.5 font-normal"
                >
                  {currentUser.role}
                </Badge>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <nav className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 block mb-2">
              {t("admin-nav-section-manage") || "Management"}
            </span>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                    link.active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="pt-4 border-t border-border/60 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLanguageSwitch}
            className="w-full text-xs justify-start text-muted-foreground hover:text-foreground"
          >
            <Globe className="size-3.5 mr-2 rtl:ml-2 rtl:mr-0" />
            <span className="text-[11px]">
              {isAr ? "English (EN)" : "العربية (AR)"}
            </span>
          </Button>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">MIRÉ v1.0</span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header Bar (Hidden on desktop) */}
        <header className="lg:hidden flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="size-9 p-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>

            <Link
              href="/admin/dashboard"
              className="font-serif text-xl tracking-[.15em] text-ds-text-primary"
            >
              MIRÉ{" "}
              <span className="ms-1.5 font-sans text-xs tracking-normal text-ds-text-muted">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLanguageSwitch}
              className="text-xs h-8 px-2"
            >
              <Globe className="size-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
              <span className="uppercase text-[11px] font-medium font-mono">
                {isAr ? "EN" : "عربي"}
              </span>
            </Button>
            <LogoutButton />
          </div>
        </header>

        {/* Page Content (Only this scrolls) */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
