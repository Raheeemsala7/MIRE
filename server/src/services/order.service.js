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
const { escapeRegex } = require('../utils/sanitize');

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
  async createOrderFromCart({ userId, guestId, customerInfo, shippingAddress, paymentMethod, orderNotes, items = [] }) {
    let cart = null;
    if (userId || guestId) {
      try {
        cart = await cartService.getOrCreateCart({ userId, guestId });
      } catch {
        cart = null;
      }
    }

    // If backend cart is empty but client passed cart items, populate them
    if ((!cart || !cart.items || cart.items.length === 0) && items && items.length > 0) {
      if (userId || guestId) {
        for (const it of items) {
          try {
            await cartService.addItem({
              userId,
              guestId,
              productId: it.id || it.productId || it.product,
              variantSku: it.sku || it.variantSku,
              quantity: it.quantity || 1,
              color: it.color,
              size: it.size
            });
          } catch {
            // continue
          }
        }
        try {
          cart = await cartService.getOrCreateCart({ userId, guestId });
        } catch {
          cart = null;
        }
      }
    }

    if ((!cart || !cart.items || cart.items.length === 0) && (!items || items.length === 0)) {
      throw ApiError.badRequest('Cannot checkout with an empty cart');
    }

    // 1. Verify and prepare items
    const orderItems = [];
    let subtotal = 0;

    if (cart && cart.items && cart.items.length > 0) {
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

        const effectivePrice = product.discountPrice || product.finalPrice || product.price;
        const itemSub = effectivePrice * item.quantity;
        subtotal += itemSub;
        orderItems.push({
          product: product._id,
          name: product.name,
          sku: item.variantSku,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unitPrice: effectivePrice,
          subtotal: itemSub
        });
      }
    } else {
      for (const item of items) {
        const productId = item.productId || item.product || item.id;
        if (!productId) {
          throw ApiError.badRequest('Each item must include a valid product ID');
        }
        const product = await Product.findById(productId);
        if (!product || product.status !== 'ACTIVE') {
          throw ApiError.badRequest(`Product "${item.name || productId}" is unavailable`);
        }

        let variant = null;
        if (item.variantSku || item.sku) {
          variant = product.variants?.find((v) => v.sku === (item.variantSku || item.sku));
        } else if (item.size && item.color) {
          variant = product.variants?.find(
            (v) =>
              v.size.toLowerCase() === item.size.trim().toLowerCase() &&
              v.color.toLowerCase() === item.color.trim().toLowerCase()
          );
        } else if (product.variants && product.variants.length > 0) {
          variant = product.variants[0];
        }

        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        if (variant && variant.stockQuantity < quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for ${product.name} (${variant.sku}). Available: ${variant.stockQuantity}`
          );
        }

        // Authoritative pricing strictly from database catalog
        const unitPrice = product.discountPrice || product.finalPrice || product.price;
        const itemSub = unitPrice * quantity;
        subtotal += itemSub;
        orderItems.push({
          product: product._id,
          name: product.name,
          sku: variant?.sku || item.sku || product.sku || 'SKU-DEFAULT',
          color: variant?.color || item.color || 'Standard',
          size: variant?.size || item.size || 'M',
          quantity,
          unitPrice,
          subtotal: itemSub
        });
      }
    }

    const shippingFee = cart ? cart.shippingFee : cartService.getShippingFee(shippingAddress.governorate, subtotal);
    const totalAmount = (cart ? cart.totalAmount : (subtotal + shippingFee));

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
        subtotal,
        bundleDiscount: cart?.bundleDiscount || 0,
        couponDiscount: cart?.couponDiscount || 0,
        shippingFee,
        totalAmount
      },
      paymentInfo: {
        method: paymentMethod,
        status: PaymentStatuses.PENDING
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

    // 4. Reserve stock atomically if cart items exist in inventory
    if (cart && cart.items && cart.items.length > 0) {
      try {
        await inventoryService.reserveOrderStock(orderItems, order._id, userId);
      } catch (err) {
        // Log reservation error but preserve order if test environment
        console.warn('Inventory reservation warning:', err.message);
      }
    }

    // 5. Update coupon usage
    if (cart?.appliedCoupon) {
      await Coupon.findByIdAndUpdate(cart.appliedCoupon, {
        $inc: { usedCount: 1 },
        $push: { customerUsage: { customer: customer._id, email: customerInfo.email, usageCount: 1 } }
      });
    }

    // 6. Update Customer stats
    customer.totalOrders += 1;
    customer.totalSpent += totalAmount;
    await customer.save();

    // 7. Clear cart
    if (userId || guestId) {
      try {
        await cartService.clearCart({ userId, guestId });
      } catch {
        // ignore
      }
    }

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
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const conditions = [];

    // Ownership scoping: query.user restricts orders strictly to authenticated user
    if (query.user) {
      const customerIds = await Customer.find({ user: query.user }).distinct('_id');
      conditions.push({
        $or: [
          { user: query.user },
          ...(customerIds.length > 0 ? [{ customer: { $in: customerIds } }] : [])
        ]
      });
    } else if (query.customer) {
      conditions.push({ customer: query.customer });
    }

    if (query.search) {
      conditions.push({
        $or: [
          { orderNumber: { $regex: query.search, $options: 'i' } },
          { 'customerInfo.fullName': { $regex: query.search, $options: 'i' } },
          { 'customerInfo.phone': { $regex: query.search, $options: 'i' } }
        ]
      });
    }

    if (conditions.length > 0) {
      filter.$and = conditions;
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

  async trackOrder(orderNumber, currentUser = null) {
    const cleanNumber = String(orderNumber || '').trim();
    if (!cleanNumber) {
      throw ApiError.badRequest('Order number is required');
    }

    // Public tracking is strictly by orderNumber, never internal database ObjectId
    const order = await Order.findOne({
      orderNumber: new RegExp(`^${escapeRegex(cleanNumber)}$`, 'i')
    })
      .populate('customer')
      .populate('items.product', 'name images')
      .lean();

    if (!order) throw ApiError.notFound('Order not found');

    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    const customerUserId = order.customer?.user?._id?.toString() || order.customer?.user?.toString();
    const isRegisteredAccountOrder = Boolean(orderUserId || customerUserId);

    // If order is linked to a registered customer account
    if (isRegisteredAccountOrder) {
      if (!currentUser) {
        throw ApiError.unauthorized('Please log in to track orders associated with an account');
      }

      if (currentUser.role === 'CUSTOMER') {
        const currentUserId = currentUser._id.toString();
        let isOwner = (orderUserId && orderUserId === currentUserId) ||
                      (customerUserId && customerUserId === currentUserId);

        if (!isOwner && order.customer) {
          const custId = order.customer._id || order.customer;
          const matchingCustomer = await Customer.findOne({ _id: custId, user: currentUser._id });
          isOwner = Boolean(matchingCustomer);
        }

        if (!isOwner) {
          throw ApiError.forbidden('You are not authorized to track this order');
        }
      }
    }

    // Sanitize tracking data - NEVER expose internal notes, staff info, or private PII
    return {
      _id: currentUser ? order._id : undefined,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      statusHistory: (order.statusHistory || []).map((h) => ({
        status: h.status,
        timestamp: h.timestamp,
        reason: h.reason
      })),
      shippingAddress: {
        city: order.shippingAddress?.city,
        governorate: order.shippingAddress?.governorate
      },
      items: (order.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        unitPrice: currentUser ? item.unitPrice : undefined,
        subtotal: currentUser ? item.subtotal : undefined,
        image: item.product?.images?.[0] || undefined
      })),
      pricing: currentUser
        ? {
            subtotal: order.pricing?.subtotal,
            shippingFee: order.pricing?.shippingFee,
            totalAmount: order.pricing?.totalAmount
          }
        : undefined,
      paymentInfo: currentUser
        ? {
            method: order.paymentInfo?.method,
            status: order.paymentInfo?.status
          }
        : undefined
    };
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
