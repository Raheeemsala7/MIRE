const { Return, ReturnStatuses } = require('../models/Return');
const { Order, OrderStatuses } = require('../models/Order');
const Notification = require('../models/Notification');
const inventoryService = require('./inventory.service');
const ApiError = require('../utils/apiError');
const { getIO } = require('../config/socket');
const { recordAudit } = require('../utils/auditLogger');
const { getPaginationOptions } = require('../utils/pagination');

class ReturnService {
  async generateReturnNumber() {
    const year = new Date().getFullYear();
    const count = await Return.countDocuments();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RET-${year}-${sequence}`;
  }

  /**
   * Request a new return (Storefront customer or Customer Support)
   */
  async requestReturn({ originalOrderId, items, reason, reasonDetails, refundMethod, performedBy = null }) {
    const order = await Order.findById(originalOrderId);
    if (!order) {
      throw ApiError.notFound('Original order not found');
    }

    if (order.status !== OrderStatuses.DELIVERED) {
      throw ApiError.badRequest('Can only request returns for DELIVERED orders');
    }

    // Verify items belong to original order and quantities do not exceed order items
    let refundAmount = 0;
    const formattedItems = [];

    for (const retItem of items) {
      const orderItem = order.items.find((oi) => oi.sku === retItem.sku);
      if (!orderItem) {
        throw ApiError.badRequest(`Item with SKU ${retItem.sku} was not part of order ${order.orderNumber}`);
      }

      if (retItem.quantity > orderItem.quantity) {
        throw ApiError.badRequest(
          `Requested return quantity (${retItem.quantity}) exceeds ordered quantity (${orderItem.quantity}) for ${orderItem.name}`
        );
      }

      const itemRefund = orderItem.unitPrice * retItem.quantity;
      refundAmount += itemRefund;

      formattedItems.push({
        product: orderItem.product,
        sku: retItem.sku,
        color: retItem.color,
        size: retItem.size,
        quantity: retItem.quantity,
        unitPrice: orderItem.unitPrice,
        condition: 'PENDING_INSPECTION',
        restockApproved: false
      });
    }

    const returnNumber = await this.generateReturnNumber();

    const returnDoc = await Return.create({
      returnNumber,
      originalOrder: order._id,
      customer: order.customer,
      items: formattedItems,
      reason,
      reasonDetails: reasonDetails || '',
      status: ReturnStatuses.RETURN_REQUESTED,
      refundAmount,
      refundMethod: refundMethod || 'CASH',
      statusHistory: [
        {
          status: ReturnStatuses.RETURN_REQUESTED,
          changedBy: performedBy,
          notes: 'Return requested',
          timestamp: new Date()
        }
      ]
    });

    // Notify staff
    await Notification.create({
      type: 'NEW_RETURN',
      title: 'New Return Request',
      message: `Return #${returnNumber} requested for Order #${order.orderNumber} (${refundAmount} EGP)`,
      recipientRole: 'ORDER_MANAGER',
      entityType: 'Return',
      entityId: returnDoc._id
    });

    const io = getIO();
    io.emit('return:created', returnDoc);

    return returnDoc;
  }

  /**
   * Get paginated returns
   */
  async getReturns(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {};

    if (query.status) filter.status = query.status;
    if (query.assignedEmployee) filter.assignedEmployee = query.assignedEmployee;
    if (query.search) {
      filter.$or = [{ returnNumber: { $regex: query.search, $options: 'i' } }];
    }

    const [returns, total] = await Promise.all([
      Return.find(filter)
        .populate('customer', 'fullName phone email')
        .populate('originalOrder', 'orderNumber status createdAt')
        .populate('assignedEmployee', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Return.countDocuments(filter)
    ]);

    return { returns, total, page, limit };
  }

  /**
   * Get single return by ID
   */
  async getReturnById(id) {
    const returnDoc = await Return.findById(id)
      .populate('customer')
      .populate('originalOrder')
      .populate('assignedEmployee', 'name email role')
      .populate('items.product', 'name images')
      .populate('inspectedBy', 'name role')
      .populate('statusHistory.changedBy', 'name role');

    if (!returnDoc) throw ApiError.notFound('Return request not found');
    return returnDoc;
  }

  /**
   * Update return status workflow
   */
  async updateStatus(id, newStatus, notes = '', performedBy = null) {
    const returnDoc = await Return.findById(id);
    if (!returnDoc) throw ApiError.notFound('Return request not found');

    const previousStatus = returnDoc.status;
    returnDoc.status = newStatus;

    if (newStatus === ReturnStatuses.REFUNDED) {
      returnDoc.refundStatus = 'PROCESSED';
    }

    returnDoc.statusHistory.push({
      status: newStatus,
      changedBy: performedBy,
      notes,
      timestamp: new Date()
    });

    await returnDoc.save();

    await recordAudit({
      action: 'RETURN_STATUS_UPDATED',
      entityType: 'Return',
      entityId: returnDoc._id,
      performedBy,
      previousState: { status: previousStatus },
      newState: { status: newStatus },
      details: { notes }
    });

    const io = getIO();
    io.emit('return:status_updated', {
      returnId: returnDoc._id,
      returnNumber: returnDoc.returnNumber,
      status: newStatus
    });

    return returnDoc;
  }

  /**
   * Inspect returned items and conditionally restore inventory
   * RULE: Restore inventory stock ONLY after the returned item has been received and inspected!
   */
  async inspectReturn(id, { inspectionNotes, itemInspections }, performedBy) {
    const returnDoc = await Return.findById(id);
    if (!returnDoc) throw ApiError.notFound('Return request not found');

    returnDoc.inspectionNotes = inspectionNotes;
    returnDoc.inspectedBy = performedBy;
    returnDoc.inspectedAt = new Date();
    returnDoc.status = ReturnStatuses.INSPECTED;

    for (const insp of itemInspections) {
      const item = returnDoc.items.id(insp.itemId);
      if (item) {
        item.condition = insp.condition;
        item.restockApproved = insp.restockApproved;

        // Restore inventory ONLY if restock is approved and not already restocked
        if (insp.restockApproved && !item.restockedAt) {
          await inventoryService.adjustStock({
            productId: item.product,
            variantSku: item.sku,
            quantityChange: item.quantity,
            type: 'RETURN',
            reason: `Restocked from Return #${returnDoc.returnNumber} (Condition: ${insp.condition})`,
            referenceOrder: returnDoc.originalOrder,
            performedBy
          });
          item.restockedAt = new Date();
        }
      }
    }

    returnDoc.statusHistory.push({
      status: ReturnStatuses.INSPECTED,
      changedBy: performedBy,
      notes: `Inspection completed: ${inspectionNotes}`,
      timestamp: new Date()
    });

    await returnDoc.save();

    await recordAudit({
      action: 'RETURN_INSPECTED',
      entityType: 'Return',
      entityId: returnDoc._id,
      performedBy,
      details: { inspectionNotes, itemInspections }
    });

    return returnDoc;
  }

  /**
   * Customer not responding call attempt tracking
   */
  async logCallAttempt(id, { result, notes }, performedBy) {
    const returnDoc = await Return.findById(id);
    if (!returnDoc) throw ApiError.notFound('Return request not found');

    const attemptNumber = returnDoc.callAttempts.length + 1;
    returnDoc.callAttempts.push({
      attemptNumber,
      result,
      notes: notes || '',
      attemptedAt: new Date(),
      attemptedBy: performedBy
    });

    if (result === 'CUSTOMER_REFUSED') {
      returnDoc.status = ReturnStatuses.REJECTED;
    }

    await returnDoc.save();
    return returnDoc;
  }

  /**
   * Assign return to employee
   */
  async assignReturn(id, employeeId, performedBy) {
    const returnDoc = await Return.findById(id);
    if (!returnDoc) throw ApiError.notFound('Return not found');

    returnDoc.assignedEmployee = employeeId;
    await returnDoc.save();

    await recordAudit({
      action: 'RETURN_ASSIGNED',
      entityType: 'Return',
      entityId: returnDoc._id,
      performedBy,
      details: { assignedEmployee: employeeId }
    });

    return returnDoc;
  }
}

module.exports = new ReturnService();
