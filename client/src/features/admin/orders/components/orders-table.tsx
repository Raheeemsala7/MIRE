"use client";

import { useState, useMemo } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import {
  Search,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  Phone,
  Filter,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  type OrderDoc,
  type OrderStatus,
  ORDER_STATUS_CONFIG,
} from "../types/order-admin.types";
import { useUpdateOrderStatus } from "../hooks/use-update-order-status";

interface OrdersTableProps {
  initialOrders: OrderDoc[];
  totalCount: number;
}

export function OrdersTable({ initialOrders, totalCount }: OrdersTableProps) {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const currency = isAr ? "ج.م" : "EGP";

  const [orders, setOrders] = useState<OrderDoc[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === "ALL" || order.status === selectedStatus;

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerInfo.fullName.toLowerCase().includes(term) ||
        order.customerInfo.phone.includes(term) ||
        order.shippingAddress.city.toLowerCase().includes(term) ||
        order.shippingAddress.governorate.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = orders.length;
    const processing = orders.filter(
      (o) => o.status === "NEW" || o.status === "CONFIRMED" || o.status === "PROCESSING"
    ).length;
    const shipped = orders.filter((o) => o.status === "SHIPPED" || o.status === "READY_TO_SHIP").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const totalRevenue = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + (o.pricing?.totalAmount || 0), 0);

    return { total, processing, shipped, delivered, totalRevenue };
  }, [orders]);

  const updateStatusMutation = useUpdateOrderStatus();

  // Handle Quick Status Change
  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    updateStatusMutation.mutate(
      {
        orderId,
        status: newStatus as any,
        reason: isAr
          ? `تحديث سريع للحالة إلى ${ORDER_STATUS_CONFIG[newStatus]?.labelAr}`
          : `Quick status update to ${newStatus}`,
      },
      {
        onSuccess: () => {
          setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
          );
          setUpdatingOrderId(null);
        },
        onError: () => {
          setUpdatingOrderId(null);
        },
      }
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status] || {
      labelAr: status,
      labelEn: status,
      badgeClass: "border-border bg-muted text-muted-foreground",
      dotColor: "bg-muted-foreground",
    };

    return (
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${config.badgeClass}`}
      >
        <span className={`size-1.5 rounded-full ${config.dotColor}`} />
        <span>{isAr ? config.labelAr : config.labelEn}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <ShoppingBag className="size-6 text-primary" />
            <span>{isAr ? "إدارة الطلبات والمبيعات" : "Orders & Fulfillment"}</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {isAr
              ? "متابعة الطلبات، تحديث الحالات (تجهيز، شحن، توصيل)، والاطلاع على تفاصيل العملاء والشحن"
              : "Track orders, manage fulfillment lifecycle (processing, shipping, delivery), and view customer details"}
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Total Orders */}
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {isAr ? "إجمالي الطلبات" : "Total Orders"}
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5">
            <div className="font-mono text-2xl font-bold text-foreground">
              {stats.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr ? "جميع الطلبات المسجلة" : "Across all channels"}
            </p>
          </CardContent>
        </Card>

        {/* In Processing */}
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {isAr ? "قيد المراجعة والتجهيز" : "Processing"}
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Clock className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5">
            <div className="font-mono text-2xl font-bold text-foreground">
              {stats.processing}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              {isAr ? "تحتاج للتجهيز والتغليف" : "Needs packaging"}
            </p>
          </CardContent>
        </Card>

        {/* Shipped */}
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {isAr ? "خرجت للتوصيل" : "Out for Delivery"}
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
              <Truck className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5">
            <div className="font-mono text-2xl font-bold text-foreground">
              {stats.shipped}
            </div>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-0.5 font-medium">
              {isAr ? "مع مندوب التوصيل" : "In transit with courier"}
            </p>
          </CardContent>
        </Card>

        {/* Delivered & Revenue */}
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {isAr ? "تم تسليمها بنجاح" : "Delivered"}
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5">
            <div className="font-mono text-2xl font-bold text-foreground">
              {stats.delivered}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              {isAr
                ? `إجمالي مبيعات: ${stats.totalRevenue.toLocaleString()} ${currency}`
                : `Total: ${stats.totalRevenue.toLocaleString()} ${currency}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isAr
                    ? "ابحث برقم الطلب، اسم العميل، الهاتف، أو المدينة..."
                    : "Search by order #, customer name, phone, city..."
                }
                className="ps-9 h-9 text-xs rounded-xl border-border/60 bg-muted/20"
              />
            </div>

            {/* Status Select Filter */}
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {isAr ? "الحالة:" : "Status:"}
              </span>
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val)}
              >
                <SelectTrigger className="h-9 w-[190px] text-xs rounded-xl border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{isAr ? "جميع الحالات" : "All Statuses"}</SelectItem>
                  <SelectItem value="NEW">{isAr ? "طلب جديد" : "New Order"}</SelectItem>
                  <SelectItem value="CONFIRMED">{isAr ? "تم التأكيد" : "Confirmed"}</SelectItem>
                  <SelectItem value="PROCESSING">{isAr ? "تم التجهيز / جاري التجهيز" : "Processing"}</SelectItem>
                  <SelectItem value="READY_TO_SHIP">{isAr ? "جاهز للشحن" : "Ready to Ship"}</SelectItem>
                  <SelectItem value="SHIPPED">{isAr ? "تم الشحن / خرج للتوصيل" : "Shipped"}</SelectItem>
                  <SelectItem value="DELIVERED">{isAr ? "تم التوصيل" : "Delivered"}</SelectItem>
                  <SelectItem value="CANCELLED">{isAr ? "ملغي" : "Cancelled"}</SelectItem>
                </SelectContent>
              </Select>

              {searchTerm || selectedStatus !== "ALL" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("ALL");
                  }}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isAr ? "إعادة ضبط" : "Reset"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-[150px] text-xs font-semibold text-foreground">
                  {isAr ? "رقم الطلب" : "Order #"}
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  {isAr ? "العميلة / العميل" : "Customer"}
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  {isAr ? "عنوان التوصيل" : "Delivery Address"}
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  {isAr ? "المنتجات" : "Items"}
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  {isAr ? "المبلغ الإجمالي" : "Total Amount"}
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  {isAr ? "حالة الطلب الحالية" : "Current Status"}
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  {isAr ? "تغيير سريع للحالة" : "Quick Action"}
                </TableHead>
                <TableHead className="w-[100px] text-end text-xs font-semibold text-foreground">
                  {isAr ? "التفاصيل" : "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-44 text-center text-xs text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="size-8 text-muted-foreground/40" />
                      <p>{isAr ? "لا توجد طلبات مطابقة للبحث" : "No orders found matching filters"}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  let formattedDate = "";
                  try {
                    const d = new Date(order.createdAt);
                    formattedDate = d.toLocaleDateString(
                      isAr ? "ar-EG-u-nu-latn" : "en-US",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    );
                  } catch {
                    formattedDate = "";
                  }

                  const firstItem = order.items?.[0];
                  const remainingCount = (order.items?.length || 1) - 1;

                  return (
                    <TableRow
                      key={order._id}
                      className="border-border/60 hover:bg-muted/20 transition-colors"
                    >
                      {/* Order Number & Date */}
                      <TableCell className="align-middle py-3.5">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="font-mono text-xs font-bold text-primary hover:underline block"
                        >
                          #{order.orderNumber}
                        </Link>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          {formattedDate}
                        </span>
                      </TableCell>

                      {/* Customer Info */}
                      <TableCell className="align-middle py-3.5">
                        <div className="font-medium text-xs text-foreground">
                          {order.customerInfo?.fullName || "Guest Customer"}
                        </div>
                        <a
                          href={`tel:${order.customerInfo?.phone}`}
                          className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="size-3 opacity-70" />
                          <span>{order.customerInfo?.phone}</span>
                        </a>
                      </TableCell>

                      {/* Delivery Address */}
                      <TableCell className="align-middle py-3.5 max-w-[180px]">
                        <div className="text-xs text-foreground truncate">
                          {order.shippingAddress?.city}، {order.shippingAddress?.governorate}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {order.shippingAddress?.street}
                        </div>
                      </TableCell>

                      {/* Items */}
                      <TableCell className="align-middle py-3.5 max-w-[200px]">
                        <div className="text-xs text-foreground truncate">
                          {firstItem?.name || "Product"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {remainingCount > 0 ? (
                            <span className="text-primary font-medium">
                              +{remainingCount} {isAr ? "منتجات أخرى" : "more items"}
                            </span>
                          ) : (
                            <span>
                              {firstItem?.color} • {firstItem?.size} (×{firstItem?.quantity})
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Total Amount & Payment */}
                      <TableCell className="align-middle py-3.5">
                        <div className="font-mono font-bold text-xs text-foreground">
                          {order.pricing?.totalAmount?.toLocaleString()} {currency}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono py-0 px-1.5 uppercase"
                          >
                            {order.paymentInfo?.method || "COD"}
                          </Badge>
                          <span
                            className={`text-[10px] font-medium ${
                              order.paymentInfo?.status === "PAID"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {order.paymentInfo?.status === "PAID"
                              ? isAr
                                ? "مدفوع"
                                : "Paid"
                              : isAr
                              ? "عند الاستلام"
                              : "Pending"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="align-middle py-3.5">
                        {getStatusBadge(order.status)}
                      </TableCell>

                      {/* Quick Status Select */}
                      <TableCell className="align-middle py-3.5">
                        <Select
                          value={order.status}
                          disabled={updatingOrderId === order._id}
                          onValueChange={(newVal) =>
                            handleQuickStatusChange(order._id, newVal as OrderStatus)
                          }
                        >
                          <SelectTrigger className="h-8 w-[145px] text-[11px] rounded-lg border-border/60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">
                              {ORDER_STATUS_CONFIG.NEW.labelAr}
                            </SelectItem>
                            <SelectItem value="CONFIRMED">
                              {ORDER_STATUS_CONFIG.CONFIRMED.labelAr}
                            </SelectItem>
                            <SelectItem value="PROCESSING">
                              {ORDER_STATUS_CONFIG.PROCESSING.labelAr}
                            </SelectItem>
                            <SelectItem value="READY_TO_SHIP">
                              {ORDER_STATUS_CONFIG.READY_TO_SHIP.labelAr}
                            </SelectItem>
                            <SelectItem value="SHIPPED">
                              {ORDER_STATUS_CONFIG.SHIPPED.labelAr}
                            </SelectItem>
                            <SelectItem value="DELIVERED">
                              {ORDER_STATUS_CONFIG.DELIVERED.labelAr}
                            </SelectItem>
                            <SelectItem value="CANCELLED">
                              {ORDER_STATUS_CONFIG.CANCELLED.labelAr}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* View Details Action */}
                      <TableCell className="align-middle text-end py-3.5">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 px-2.5 text-xs gap-1 border-border/60 hover:border-primary/40"
                        >
                          <Link href={`/admin/orders/${order._id}`}>
                            <span>{isAr ? "التفاصيل" : "Details"}</span>
                            <ChevronRight className="size-3.5 rtl:rotate-180 opacity-70" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
