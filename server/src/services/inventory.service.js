const { Product } = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');
const { getIO } = require('../config/socket');
const { recordAudit } = require('../utils/auditLogger');
const { getPaginationOptions } = require('../utils/pagination');

class InventoryService {
  /**
   * Adjust stock for a variant atomically and log the movement
   */
  async adjustStock({
    productId,
    variantSku,
    quantityChange,
    type,
    reason = '',
    referenceOrder = null,
    performedBy = null,
    req = null
  }) {
    // 1. Fetch product and find target variant
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const variantIndex = product.variants.findIndex((v) => v.sku === variantSku);
    if (variantIndex === -1) {
      throw ApiError.notFound(`Variant with SKU ${variantSku} not found on product`);
    }

    const variant = product.variants[variantIndex];
    const previousStock = variant.stockQuantity;
    const newStock = previousStock + quantityChange;

    if (newStock < 0) {
      throw ApiError.badRequest(
        `Insufficient stock for SKU ${variantSku}. Available: ${previousStock}, Requested deduction: ${Math.abs(quantityChange)}`
      );
    }

    // 2. Perform atomic update with condition to prevent race conditions & overselling
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        'variants.sku': variantSku,
        ...(quantityChange < 0 ? { 'variants.stockQuantity': { $gte: Math.abs(quantityChange) } } : {})
      },
      {
        $inc: {
          'variants.$.stockQuantity': quantityChange,
          totalStock: quantityChange
        }
      },
      { new: true }
    );

    if (!updatedProduct) {
      throw ApiError.conflict(
        `Failed to adjust stock for ${variantSku}. Concurrent modification or insufficient stock detected.`
      );
    }

    const updatedVariant = updatedProduct.variants.find((v) => v.sku === variantSku);

    // 3. Record Inventory Movement History
    const movement = await InventoryMovement.create({
      product: productId,
      variantSku,
      color: variant.color,
      size: variant.size,
      type,
      quantityChange,
      previousStock,
      newStock: updatedVariant.stockQuantity,
      reason,
      referenceOrder,
      performedBy
    });

    // 4. Audit Log
    await recordAudit({
      action: 'INVENTORY_ADJUSTED',
      entityType: 'InventoryMovement',
      entityId: movement._id,
      performedBy,
      details: {
        product: product.name,
        variantSku,
        quantityChange,
        type,
        newStock: updatedVariant.stockQuantity
      },
      req
    });

    // 5. Low-stock trigger check
    if (updatedVariant.stockQuantity <= product.lowStockThreshold) {
      await this.triggerLowStockAlert(product, updatedVariant);
    }

    return { product: updatedProduct, movement };
  }

  /**
   * Atomically reserve stock for all items in an order.
   * If any item is out of stock, rolls back all previous deductions.
   */
  async reserveOrderStock(items, referenceOrderId, performedBy) {
    const reservedItems = [];

    try {
      for (const item of items) {
        const result = await this.adjustStock({
          productId: item.product,
          variantSku: item.sku,
          quantityChange: -item.quantity,
          type: 'SALE',
          reason: `Reserved for Order #${referenceOrderId}`,
          referenceOrder: referenceOrderId,
          performedBy
        });
        reservedItems.push({ item, result });
      }
      return true;
    } catch (err) {
      // Rollback all already reserved items
      for (const res of reservedItems) {
        await this.adjustStock({
          productId: res.item.product,
          variantSku: res.item.sku,
          quantityChange: res.item.quantity,
          type: 'RELEASE',
          reason: `Rollback reservation due to order failure: ${err.message}`,
          referenceOrder: referenceOrderId,
          performedBy
        });
      }
      throw err;
    }
  }

  /**
   * Release reserved order stock (e.g. order cancelled)
   */
  async releaseOrderStock(items, referenceOrderId, performedBy) {
    for (const item of items) {
      await this.adjustStock({
        productId: item.product,
        variantSku: item.sku,
        quantityChange: item.quantity,
        type: 'RELEASE',
        reason: `Released from cancelled Order #${referenceOrderId}`,
        referenceOrder: referenceOrderId,
        performedBy
      });
    }
  }

  /**
   * Trigger low-stock alerts through Socket.IO and Notification
   */
  async triggerLowStockAlert(product, variant) {
    const alertData = {
      productId: product._id,
      productName: product.name,
      variantSku: variant.sku,
      color: variant.color,
      size: variant.size,
      remainingStock: variant.stockQuantity,
      threshold: product.lowStockThreshold
    };

    // Store notification
    await Notification.create({
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${product.name} (${variant.sku} - ${variant.color}/${variant.size}) has only ${variant.stockQuantity} items left!`,
      recipientRole: 'INVENTORY_MANAGER',
      entityType: 'Product',
      entityId: product._id
    });

    // Real-time broadcast
    const io = getIO();
    io.emit('inventory:low_stock', alertData);
  }

  /**
   * Get all products/variants with stock <= lowStockThreshold
   */
  async getLowStockItems() {
    const products = await Product.find({ status: 'ACTIVE' }).populate('category', 'name slug');
    const lowStockItems = [];

    for (const p of products) {
      for (const v of p.variants) {
        if (v.stockQuantity <= p.lowStockThreshold) {
          lowStockItems.push({
            productId: p._id,
            productName: p.name,
            productSku: p.sku,
            category: p.category?.name || 'Uncategorized',
            variantSku: v.sku,
            color: v.color,
            size: v.size,
            stockQuantity: v.stockQuantity,
            threshold: p.lowStockThreshold
          });
        }
      }
    }

    return lowStockItems;
  }

  /**
   * Get paginated inventory movement history
   */
  async getMovements(query) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {};

    if (query.productId) filter.product = query.productId;
    if (query.variantSku) filter.variantSku = query.variantSku;
    if (query.type) filter.type = query.type;

    const [movements, total] = await Promise.all([
      InventoryMovement.find(filter)
        .populate('product', 'name sku images')
        .populate('performedBy', 'name email role')
        .populate('referenceOrder', 'orderNumber status')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      InventoryMovement.countDocuments(filter)
    ]);

    return { movements, total, page, limit };
  }
}

module.exports = new InventoryService();
