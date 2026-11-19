import { z } from "zod";

export const analyticsFilterSchema = z.object({
  range: z.enum(["today", "yesterday", "7d", "30d", "custom"]).default("30d"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const dashboardOverviewSchema = z.object({
  totalRevenue: z.number().default(0),
  todayRevenue: z.number().default(0),
  totalOrders: z.number().default(0),
  newOrders: z.number().default(0),
  pendingOrders: z.number().default(0),
  deliveredOrders: z.number().default(0),
  cancelledOrders: z.number().default(0),
  returnedOrders: z.number().default(0),
  totalCustomers: z.number().default(0),
  averageOrderValue: z.number().default(0),
  returnRate: z.string().default("0%"),
  deliverySuccessRate: z.string().default("0%"),
});

export const dailyRevenueItemSchema = z.object({
  _id: z.string(),
  revenue: z.number().default(0),
  orders: z.number().default(0),
});

export const orderStatusItemSchema = z.object({
  status: z.string(),
  count: z.number().default(0),
});

export const categorySalesItemSchema = z.object({
  category: z.string(),
  revenue: z.number().default(0),
  count: z.number().default(0),
});

export const bestSellerItemSchema = z.object({
  _id: z.unknown().transform((val) => String(val)),
  name: z.string(),
  sku: z.string().optional().default(""),
  totalSold: z.number().default(0),
  totalRevenue: z.number().default(0),
});

export const paymentDistributionItemSchema = z.object({
  method: z.string().nullish().transform((v) => v || "OTHER"),
  count: z.number().default(0),
  revenue: z.number().default(0),
});

export const dashboardChartsSchema = z.object({
  dailyRevenue: z.array(dailyRevenueItemSchema).default([]),
  ordersByStatus: z.array(orderStatusItemSchema).default([]),
  salesByCategory: z.array(categorySalesItemSchema).default([]),
  bestSellers: z.array(bestSellerItemSchema).default([]),
  paymentDistribution: z.array(paymentDistributionItemSchema).default([]),
});

export const analyticsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    overview: dashboardOverviewSchema,
    charts: dashboardChartsSchema,
  }),
});
