const { Order, OrderStatuses, PaymentStatuses } = require('../models/Order');
const Customer = require('../models/Customer');
const { Product } = require('../models/Product');
const { Return } = require('../models/Return');

class AnalyticsService {
  getDateRangeFilter(range = '30d', customStart = null, customEnd = null) {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday': {
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        return { $gte: startDate, $lte: endDate };
      }
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'custom':
        return {
          $gte: customStart ? new Date(customStart) : new Date(0),
          $lte: customEnd ? new Date(customEnd) : now
        };
      default:
        startDate.setDate(now.getDate() - 30);
    }

    return { $gte: startDate, $lte: now };
  }

  async getDashboardMetrics(query = {}) {
    const dateFilter = this.getDateRangeFilter(query.range, query.startDate, query.endDate);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Parallel aggregate lookups
    const [
      totalOrdersCount,
      todayOrders,
      ordersByStatus,
      paidRevenueTotal,
      todayRevenueTotal,
      totalCustomersCount,
      returnsCount,
      paymentMethodDistribution,
      salesByCategory,
      dailyRevenue
    ] = await Promise.all([
      // Total orders in period
      Order.countDocuments({ createdAt: dateFilter }),

      // Today's orders count
      Order.countDocuments({ createdAt: { $gte: todayStart } }),

      // Orders grouped by status
      Order.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Total revenue (paid orders or delivered COD orders)
      Order.aggregate([
        {
          $match: {
            createdAt: dateFilter,
            $or: [{ 'paymentInfo.status': PaymentStatuses.PAID }, { status: OrderStatuses.DELIVERED }]
          }
        },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' }, count: { $sum: 1 } } }
      ]),

      // Today's Revenue
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart },
            $or: [{ 'paymentInfo.status': PaymentStatuses.PAID }, { status: OrderStatuses.DELIVERED }]
          }
        },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ]),

      // Total customers count
      Customer.countDocuments(),

      // Returns count
      Return.countDocuments({ createdAt: dateFilter }),

      // Payment method breakdown
      Order.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: '$paymentInfo.method', count: { $sum: 1 }, revenue: { $sum: '$pricing.totalAmount' } } }
      ]),

      // Sales by Category
      Order.aggregate([
        { $match: { createdAt: dateFilter, status: { $ne: OrderStatuses.CANCELLED } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDoc'
          }
        },
        { $unwind: '$productDoc' },
        {
          $lookup: {
            from: 'categories',
            localField: 'productDoc.category',
            foreignField: '_id',
            as: 'categoryDoc'
          }
        },
        { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$categoryDoc.name',
            salesCount: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { revenue: -1 } }
      ]),

      // Daily Revenue timeline
      Order.aggregate([
        {
          $match: {
            createdAt: dateFilter,
            status: { $nin: [OrderStatuses.CANCELLED] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$pricing.totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Map order counts by status
    const statusMap = {};
    ordersByStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    const totalRevenue = paidRevenueTotal[0]?.total || 0;
    const paidOrdersCount = paidRevenueTotal[0]?.count || 0;
    const todayRevenue = todayRevenueTotal[0]?.total || 0;
    const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;

    const deliveredCount = statusMap[OrderStatuses.DELIVERED] || 0;
    const cancelledCount = statusMap[OrderStatuses.CANCELLED] || 0;
    const returnRate = totalOrdersCount > 0 ? ((returnsCount / totalOrdersCount) * 100).toFixed(1) : 0;
    const deliverySuccessRate =
      totalOrdersCount > 0 ? ((deliveredCount / (totalOrdersCount - cancelledCount || 1)) * 100).toFixed(1) : 0;

    // Best-selling products
    const bestSellers = await Order.aggregate([
      { $match: { createdAt: dateFilter, status: { $ne: OrderStatuses.CANCELLED } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 6 }
    ]);

    return {
      overview: {
        totalRevenue,
        todayRevenue,
        totalOrders: totalOrdersCount,
        newOrders: statusMap[OrderStatuses.NEW] || 0,
        pendingOrders: (statusMap[OrderStatuses.CONFIRMED] || 0) + (statusMap[OrderStatuses.PROCESSING] || 0),
        deliveredOrders: deliveredCount,
        cancelledOrders: cancelledCount,
        returnedOrders: returnsCount,
        totalCustomers: totalCustomersCount,
        averageOrderValue,
        returnRate: `${returnRate}%`,
        deliverySuccessRate: `${deliverySuccessRate}%`
      },
      charts: {
        dailyRevenue,
        ordersByStatus: Object.keys(statusMap).map((k) => ({ status: k, count: statusMap[k] })),
        salesByCategory: salesByCategory.map((c) => ({ category: c._id || 'General', revenue: c.revenue, count: c.salesCount })),
        bestSellers,
        paymentDistribution: paymentMethodDistribution.map((p) => ({ method: p._id, count: p.count, revenue: p.revenue }))
      }
    };
  }
}

module.exports = new AnalyticsService();
