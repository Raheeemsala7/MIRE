const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const { Order, OrderStatuses, PaymentMethods, PaymentStatuses } = require('../models/Order');
const Customer = require('../models/Customer');
const { Product } = require('../models/Product');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const cartService = require('./cart.service');
const inventoryService = require('./inventory.service');
const ApiError = require('../utils/apiError');
const { getIO } = require('../config/socket');
const { recordAudit } = require('../utils/auditLogger');
const { getPaginationOptions } = require('../utils/pagination');

class OrderService {
  async generateOrderNumber() {
    const year = new Date().getFullYear();
    const count = await Order.countDocuments();
    const sequence = (count + 1).toString().padStart(5, '0');
    return `MIRE-${year}-${sequence}`;
  }

  /**
   * Create order from current shopping cart (checkout)
   */
  async createOrderFromCart({ userId, guestId, customerInfo, shippingAddress, paymentMethod, orderNotes }) {
    const cart = await cartService.getOrCreateCart({ userId, guestId });

    if (!cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Cannot checkout with an empty cart');
    }

    // 1. Verify and prepare items
    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product || product.status !== 'ACTIVE') {
        throw ApiError.badRequest(`Product is unavailable`);
      }

      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant || variant.stockQuantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for ${product.name} (${item.variantSku}). Available: ${variant?.stockQuantity || 0}`
        );
      }

      const effectivePrice = item.discountPrice || item.unitPrice;
      orderItems.push({
        product: product._id,
        name: product.name,
        sku: item.variantSku,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: effectivePrice,
        subtotal: effectivePrice * item.quantity
      });
    }

    // 2. Link or create Customer
    let customer = await Customer.findOne({ phone: customerInfo.phone });
    if (!customer) {
      customer = await Customer.create({
        user: userId,
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        secondaryPhone: customerInfo.secondaryPhone,
        addresses: [{ ...shippingAddress, isDefault: true }]
      });
    }

    const orderNumber = await this.generateOrderNumber();

    // 3. Create Order document
    const order = new Order({
      orderNumber,
      customer: customer._id,
      user: userId || null,
      customerInfo,
      shippingAddress,
      items: orderItems,
      pricing: {
        subtotal: cart.subtotal,
        bundleDiscount: cart.bundleDiscount,
        couponDiscount: cart.couponDiscount,
        shippingFee: cart.shippingFee,
        totalAmount: cart.totalAmount
      },
      paymentInfo: {
        method: paymentMethod,
        status: paymentMethod === PaymentMethods.COD ? PaymentStatuses.PENDING : PaymentStatuses.PENDING
      },
      status: OrderStatuses.NEW,
      orderNotes: orderNotes || '',
      statusHistory: [
        {
          status: OrderStatuses.NEW,
          reason: 'Order placed by customer',
          timestamp: new Date()
        }
      ]
    });

    await order.save();

    // 4. Reserve stock atomically (with automatic rollback on failure)
    await inventoryService.reserveOrderStock(orderItems, order._id, userId);

    // 5. Update coupon usage
    if (cart.appliedCoupon) {
      await Coupon.findByIdAndUpdate(cart.appliedCoupon, {
        $inc: { usedCount: 1 },
        $push: { customerUsage: { customer: customer._id, email: customerInfo.email, usageCount: 1 } }
      });
    }

    // 6. Update Customer stats
    customer.totalOrders += 1;
    customer.totalSpent += cart.totalAmount;
    await customer.save();

    // 7. Clear cart
    await cartService.clearCart({ userId, guestId });

    // 8. Notifications & Real-time update
    await Notification.create({
      type: 'NEW_ORDER',
      title: 'New Order Received',
      message: `Order #${order.orderNumber} placed for ${order.pricing.totalAmount} EGP by ${customerInfo.fullName}`,
      recipientRole: 'ORDER_MANAGER',
      entityType: 'Order',
      entityId: order._id
    });

    const io = getIO();
    io.emit('order:created', order);

    return order;
  }

  /**
   * Manual order creation (from unified social inbox or phone call)
   */
  async createManualOrder({
    customerInfo,
    shippingAddress,
    items,
    paymentMethod,
    orderNotes,
    source = 'MANUAL',
    sourceConversationId = null,
    performedBy = null
  }) {
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw ApiError.notFound('Product not found');

      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant || variant.stockQuantity < item.quantity) {
        throw ApiError.badRequest(`Insufficient stock for ${product.name} (${item.variantSku})`);
      }

      const effectivePrice = product.discountPrice || product.price;
      const itemSubtotal = effectivePrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: item.variantSku,
        color: variant.color,
        size: variant.size,
        quantity: item.quantity,
        unitPrice: effectivePrice,
        subtotal: itemSubtotal
      });
    }

    const shippingFee = cartService.getShippingFee(shippingAddress.governorate, subtotal);
    const totalAmount = subtotal + shippingFee;

    let customer = await Customer.findOne({ phone: customerInfo.phone });
    if (!customer) {
      customer = await Customer.create({
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        secondaryPhone: customerInfo.secondaryPhone,
        addresses: [{ ...shippingAddress, isDefault: true }]
      });
    }

    const orderNumber = await this.generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      customerInfo,
      shippingAddress,
      items: orderItems,
      pricing: {
        subtotal,
        bundleDiscount: 0,
        couponDiscount: 0,
        shippingFee,
        totalAmount
      },
      paymentInfo: {
        method: paymentMethod,
        status: PaymentStatuses.PENDING
      },
      status: OrderStatuses.NEW,
      orderNotes: orderNotes || '',
      source,
      sourceConversationId,
      assignedEmployee: performedBy,
      statusHistory: [
        {
          status: OrderStatuses.NEW,
          changedBy: performedBy,
          reason: `Manual Order created via ${source}`,
          timestamp: new Date()
        }
      ]
    });

    await inventoryService.reserveOrderStock(orderItems, order._id, performedBy);

    customer.totalOrders += 1;
    customer.totalSpent += totalAmount;
    await customer.save();

    // Link conversation if applicable
    if (sourceConversationId) {
      const { Conversation } = require('../models/Conversation');
      await Conversation.findByIdAndUpdate(sourceConversationId, {
        $addToSet: { linkedOrders: order._id }
      });
    }

    const io = getIO();
    io.emit('order:created', order);

    return order;
  }

  /**
   * Get paginated orders with rich filters
   */
  async getOrders(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.paymentStatus) {
      filter['paymentInfo.status'] = query.paymentStatus;
    }
    if (query.paymentMethod) {
      filter['paymentInfo.method'] = query.paymentMethod;
    }
    if (query.assignedEmployee) {
      filter.assignedEmployee = query.assignedEmployee;
    }
    if (query.search) {
      filter.$or = [
        { orderNumber: { $regex: query.search, $options: 'i' } },
        { 'customerInfo.fullName': { $regex: query.search, $options: 'i' } },
        { 'customerInfo.phone': { $regex: query.search, $options: 'i' } }
      ];
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'fullName phone email totalOrders')
        .populate('assignedEmployee', 'name email role')
        .populate('items.product', 'images name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    return { orders, total, page, limit };
  }

  /**
   * Get single order by ID or orderNumber
   */
  async getOrderById(idOrNumber) {
    const isObjectId = idOrNumber.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: idOrNumber } : { orderNumber: idOrNumber };

    const order = await Order.findOne(query)
      .populate('customer')
      .populate('assignedEmployee', 'name email role')
      .populate('statusHistory.changedBy', 'name role')
      .populate('internalNotes.addedBy', 'name role')
      .populate('items.product');

    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  /**
   * Update order status with lifecycle checks & inventory release
   */
  async updateOrderStatus(id, newStatus, reason = '', performedBy = null) {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound('Order not found');

    const previousStatus = order.status;
    if (previousStatus === newStatus) return order;

    // Validation: cannot transition from CANCELLED to SHIPPED/DELIVERED
    if (previousStatus === OrderStatuses.CANCELLED) {
      throw ApiError.badRequest('Cannot modify a cancelled order');
    }

    // If cancelling, release the reserved inventory
    if (newStatus === OrderStatuses.CANCELLED) {
      await inventoryService.releaseOrderStock(order.items, order._id, performedBy);
    }

    // If delivered and payment was COD, mark payment as PAID
    if (newStatus === OrderStatuses.DELIVERED && order.paymentInfo.method === PaymentMethods.COD) {
      order.paymentInfo.status = PaymentStatuses.PAID;
      order.paymentInfo.paidAt = new Date();
    }

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      changedBy: performedBy,
      reason,
      timestamp: new Date()
    });

    await order.save();

    await recordAudit({
      action: 'ORDER_STATUS_UPDATED',
      entityType: 'Order',
      entityId: order._id,
      performedBy,
      previousState: { status: previousStatus },
      newState: { status: newStatus },
      details: { reason }
    });

    const io = getIO();
    io.emit('order:status_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: newStatus
    });

    return order;
  }

  /**
   * Bulk order status update
   */
  async bulkUpdateStatus(orderIds, status, reason, performedBy) {
    const results = [];
    for (const id of orderIds) {
      try {
        const updated = await this.updateOrderStatus(id, status, reason, performedBy);
        results.push({ id, success: true, orderNumber: updated.orderNumber });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return results;
  }

  /**
   * Assign order to an employee
   */
  async assignOrder(orderId, employeeId, performedBy) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    order.assignedEmployee = employeeId;
    await order.save();

    await recordAudit({
      action: 'ORDER_ASSIGNED',
      entityType: 'Order',
      entityId: order._id,
      performedBy,
      details: { assignedEmployee: employeeId }
    });

    return order;
  }

  /**
   * Add internal note to order
   */
  async addInternalNote(orderId, note, addedBy) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    order.internalNotes.push({
      note,
      addedBy,
      createdAt: new Date()
    });

    await order.save();
    return order.internalNotes;
  }

  /**
   * Log delivery / customer call attempt
   */
  async logDeliveryAttempt(orderId, { status, notes }, attemptedBy) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const attemptNumber = order.deliveryAttempts.length + 1;
    order.deliveryAttempts.push({
      attemptNumber,
      status,
      notes: notes || '',
      attemptedAt: new Date(),
      attemptedBy
    });

    // Auto update status if customer is not responding or refusing
    if (status === 'NO_ANSWER' && attemptNumber >= 3) {
      order.status = OrderStatuses.CUSTOMER_NOT_RESPONDING;
    } else if (status === 'CUSTOMER_REFUSED') {
      order.status = OrderStatuses.CANCELLED;
      await inventoryService.releaseOrderStock(order.items, order._id, attemptedBy);
    }

    await order.save();
    return order;
  }

  /**
   * Export orders to CSV
   */
  async exportOrdersToCSV(query = {}) {
    const { orders } = await this.getOrders({ ...query, limit: 10000 });
    const fields = [
      'orderNumber',
      'createdAt',
      'customerInfo.fullName',
      'customerInfo.phone',
      'shippingAddress.governorate',
      'shippingAddress.city',
      'status',
      'paymentInfo.method',
      'paymentInfo.status',
      'pricing.subtotal',
      'pricing.shippingFee',
      'pricing.totalAmount'
    ];
    const parser = new Parser({ fields });
    return parser.parse(orders);
  }

  /**
   * Export orders to Excel
   */
  async exportOrdersToExcel(query = {}) {
    const { orders } = await this.getOrders({ ...query, limit: 10000 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order #', key: 'orderNumber', width: 18 },
      { header: 'Date', key: 'createdAt', width: 20 },
      { header: 'Customer', key: 'customerName', width: 22 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Governorate', key: 'governorate', width: 15 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Subtotal (EGP)', key: 'subtotal', width: 15 },
      { header: 'Shipping (EGP)', key: 'shippingFee', width: 15 },
      { header: 'Total (EGP)', key: 'totalAmount', width: 15 }
    ];

    orders.forEach((o) => {
      worksheet.addRow({
        orderNumber: o.orderNumber,
        createdAt: new Date(o.createdAt).toLocaleString(),
        customerName: o.customerInfo?.fullName,
        phone: o.customerInfo?.phone,
        governorate: o.shippingAddress?.governorate,
        city: o.shippingAddress?.city,
        status: o.status,
        paymentMethod: o.paymentInfo?.method,
        paymentStatus: o.paymentInfo?.status,
        subtotal: o.pricing?.subtotal,
        shippingFee: o.pricing?.shippingFee,
        totalAmount: o.pricing?.totalAmount
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = new OrderService();
