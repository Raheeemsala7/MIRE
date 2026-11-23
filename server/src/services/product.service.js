const { Product } = require('../models/Product');
const Category = require('../models/Category');
const InventoryMovement = require('../models/InventoryMovement');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/pagination');
const { recordAudit } = require('../utils/auditLogger');

const { escapeRegex } = require('../utils/sanitize');

class ProductService {
  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getAllProducts(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {};

    // Filter by status (public storefront only sees ACTIVE by default)
    if (query.status) {
      filter.status = query.status;
    } else if (!query.admin) {
      filter.status = 'ACTIVE';
    }

    // Filter by category slug or ID
    if (query.category) {
      const categoryDoc = await Category.findOne({
        $or: [{ slug: query.category }, ...(query.category.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: query.category }] : [])]
      });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }

    // Price range
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
    }

    // Flags
    if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured === 'true';
    if (query.isNewArrival !== undefined) filter.isNewArrival = query.isNewArrival === 'true';
    if (query.isBestSeller !== undefined) filter.isBestSeller = query.isBestSeller === 'true';

    // Filter by Color
    if (query.color) {
      filter['colors.name'] = { $regex: query.color, $options: 'i' };
    }

    // Filter by Size
    if (query.size) {
      filter.sizes = query.size;
    }

    // Filter by stock status
    if (query.stockStatus === 'OUT_OF_STOCK') {
      filter.totalStock = { $lte: 0 };
    } else if (query.stockStatus === 'LOW_STOCK') {
      filter.$expr = {
        $and: [
          { $gt: ['$totalStock', 0] },
          { $lte: ['$totalStock', { $ifNull: ['$lowStockThreshold', 10] }] }
        ]
      };
    } else if (query.stockStatus === 'IN_STOCK') {
      filter.$expr = {
        $gt: ['$totalStock', { $ifNull: ['$lowStockThreshold', 10] }]
      };
    }

    // Search query
    if (query.search) {
      const sanitized = escapeRegex(query.search);
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { sku: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { tags: { $in: [new RegExp(sanitized, 'i')] } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    return { products, total, page, limit };
  }

  async getProductBySlug(slug) {
    const product = await Product.findOne({ slug }).populate('category', 'name slug description');
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  async getProductById(id) {
    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  async getRelatedProducts(productId, limit = 4) {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    return Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'ACTIVE'
    })
      .populate('category', 'name slug')
      .limit(limit);
  }

  async createProduct(data, performedBy) {
    let slug = this.generateSlug(data.name);

    // Check unique slug & SKU
    const existing = await Product.findOne({ $or: [{ slug }, { sku: data.sku }] });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Auto-compute total stock
    const totalStock = (data.variants || []).reduce((acc, v) => acc + (v.stockQuantity || 0), 0);

    const product = await Product.create({
      ...data,
      slug,
      totalStock
    });

    // Record initial stock movements
    for (const v of product.variants) {
      if (v.stockQuantity > 0) {
        await InventoryMovement.create({
          product: product._id,
          variantSku: v.sku,
          color: v.color,
          size: v.size,
          type: 'PURCHASE',
          quantityChange: v.stockQuantity,
          previousStock: 0,
          newStock: v.stockQuantity,
          reason: 'Initial Product Stock Setup',
          performedBy
        });
      }
    }

    await recordAudit({
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product._id,
      performedBy,
      newState: product.toJSON()
    });

    return product;
  }

  async updateProduct(id, data, performedBy) {
    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const previousState = product.toJSON();

    if (data.name && data.name !== product.name) {
      product.name = data.name;
      product.slug = this.generateSlug(data.name);
    }

    Object.assign(product, data);

    if (data.variants) {
      product.totalStock = data.variants.reduce((acc, v) => acc + (v.stockQuantity || 0), 0);
    }

    await product.save();

    await recordAudit({
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: product._id,
      performedBy,
      previousState,
      newState: product.toJSON()
    });

    return product;
  }

  async deleteProduct(id, performedBy) {
    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Soft delete to preserve historical integrity in past orders
    product.status = 'ARCHIVED';
    await product.save();

    await recordAudit({
      action: 'PRODUCT_ARCHIVED',
      entityType: 'Product',
      entityId: id,
      performedBy
    });

    return true;
  }
}

module.exports = new ProductService();
