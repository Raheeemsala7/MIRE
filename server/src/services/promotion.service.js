const { Bundle, BundleTypes } = require('../models/Bundle');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/pagination');

class PromotionService {
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // --- Bundles ---
  async getAllBundles(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {};

    if (query.activeOnly === 'true') {
      const now = new Date();
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
    }

    const [bundles, total] = await Promise.all([
      Bundle.find(filter)
        .populate('eligibleProducts', 'name slug sku price discountPrice images')
        .populate('eligibleCategories', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Bundle.countDocuments(filter)
    ]);

    return { bundles, total, page, limit };
  }

  async getBundleById(id) {
    const bundle = await Bundle.findById(id)
      .populate('eligibleProducts', 'name slug sku price discountPrice images variants colors sizes')
      .populate('eligibleCategories', 'name slug');
    if (!bundle) throw ApiError.notFound('Bundle not found');
    return bundle;
  }

  async createBundle(data) {
    let slug = this.generateSlug(data.title);
    const existing = await Bundle.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now().toString().slice(-4)}`;

    return Bundle.create({
      ...data,
      slug,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    });
  }

  async updateBundle(id, data) {
    const bundle = await Bundle.findById(id);
    if (!bundle) throw ApiError.notFound('Bundle not found');

    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    Object.assign(bundle, data);
    return bundle.save();
  }

  async deleteBundle(id) {
    const bundle = await Bundle.findByIdAndDelete(id);
    if (!bundle) throw ApiError.notFound('Bundle not found');
    return true;
  }

  // --- Coupons ---
  async getAllCoupons(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {};
    if (query.activeOnly === 'true') {
      const now = new Date();
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort(sort).skip(skip).limit(limit),
      Coupon.countDocuments(filter)
    ]);

    return { coupons, total, page, limit };
  }

  async createCoupon(data) {
    const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existing) throw ApiError.conflict('A coupon with this code already exists');

    return Coupon.create({
      ...data,
      code: data.code.toUpperCase(),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    });
  }

  async updateCoupon(id, data) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw ApiError.notFound('Coupon not found');

    if (data.code) data.code = data.code.toUpperCase();
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    Object.assign(coupon, data);
    return coupon.save();
  }

  async deleteCoupon(id) {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return true;
  }

  /**
   * Evaluate and calculate bundle discount on a set of cart items
   */
  async evaluateBundleDiscount(bundleId, items) {
    if (!bundleId) return { discount: 0, appliedBundle: null };

    const bundle = await Bundle.findById(bundleId);
    if (!bundle || !bundle.isActive) return { discount: 0, appliedBundle: null };

    const now = new Date();
    if (now < bundle.startDate || now > bundle.endDate) {
      return { discount: 0, appliedBundle: null, reason: 'Bundle has expired or is not yet active' };
    }

    if (bundle.usageLimit && bundle.usedCount >= bundle.usageLimit) {
      return { discount: 0, appliedBundle: null, reason: 'Bundle usage limit reached' };
    }

    // Filter items that qualify for this bundle
    const eligibleItemIndexes = [];
    const eligibleProductIds = (bundle.eligibleProducts || []).map((p) => p.toString());
    const eligibleCategoryIds = (bundle.eligibleCategories || []).map((c) => c.toString());

    let eligibleItemCount = 0;
    let eligibleSubtotal = 0;
    const sortedEligibleUnitPrices = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const prodId = it.product?._id ? it.product._id.toString() : it.product.toString();
      const catId = it.product?.category ? it.product.category.toString() : null;

      const isEligibleProduct = eligibleProductIds.length === 0 || eligibleProductIds.includes(prodId);
      const isEligibleCategory = eligibleCategoryIds.length === 0 || (catId && eligibleCategoryIds.includes(catId));

      if (isEligibleProduct && isEligibleCategory) {
        eligibleItemIndexes.push(i);
        eligibleItemCount += it.quantity;
        const price = it.discountPrice || it.unitPrice;
        eligibleSubtotal += price * it.quantity;
        for (let q = 0; q < it.quantity; q++) {
          sortedEligibleUnitPrices.push(price);
        }
      }
    }

    if (eligibleItemCount < bundle.requiredQuantity) {
      return {
        discount: 0,
        appliedBundle: null,
        reason: `Bundle requires at least ${bundle.requiredQuantity} eligible items. Currently selected: ${eligibleItemCount}`
      };
    }

    // Sort unit prices ascending so free/discount items apply fairly
    sortedEligibleUnitPrices.sort((a, b) => a - b);

    let discount = 0;

    switch (bundle.type) {
      case BundleTypes.FIXED_PRICE:
      case BundleTypes.COLLECTION_PICK: {
        // e.g. 2 items for 599 EGP
        const bundleSets = Math.floor(eligibleItemCount / bundle.requiredQuantity);
        if (bundleSets > 0 && bundle.bundlePrice !== null) {
          // Standard price of those items minus the bundle set price
          // Take the highest priced items for the bundle set to give customer the best saving
          sortedEligibleUnitPrices.reverse();
          const itemsInSets = bundleSets * bundle.requiredQuantity;
          const originalPriceOfSetItems = sortedEligibleUnitPrices.slice(0, itemsInSets).reduce((a, b) => a + b, 0);
          const bundlePriceTotal = bundleSets * bundle.bundlePrice;
          discount = Math.max(0, originalPriceOfSetItems - bundlePriceTotal);
        }
        break;
      }

      case BundleTypes.BUY_X_GET_Y: {
        // e.g. Buy 2 Get 1 Free (total 3 items, lowest 1 free)
        const totalPerGroup = bundle.requiredQuantity + bundle.freeQuantity;
        const completedGroups = Math.floor(eligibleItemCount / totalPerGroup);
        if (completedGroups > 0 && bundle.freeQuantity > 0) {
          const freeItemsCount = completedGroups * bundle.freeQuantity;
          // Free items are the lowest priced items in the selection
          sortedEligibleUnitPrices.sort((a, b) => a - b);
          discount = sortedEligibleUnitPrices.slice(0, freeItemsCount).reduce((a, b) => a + b, 0);
        }
        break;
      }

      case BundleTypes.PERCENTAGE: {
        // e.g. 20% off eligible items when meeting required quantity
        if (bundle.discountPercentage) {
          discount = (eligibleSubtotal * bundle.discountPercentage) / 100;
        }
        break;
      }
    }

    return {
      discount: Math.round(discount * 100) / 100,
      appliedBundle: bundle
    };
  }

  /**
   * Evaluate and calculate coupon discount with validations
   */
  async evaluateCouponDiscount(couponCode, subtotal, customerId = null, userEmail = null) {
    if (!couponCode) return { discount: 0, appliedCoupon: null };

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) {
      throw ApiError.badRequest('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (now < coupon.startDate) {
      throw ApiError.badRequest('Coupon is not active yet');
    }
    if (now > coupon.endDate) {
      throw ApiError.badRequest('Coupon has expired');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw ApiError.badRequest('Coupon usage limit has been reached');
    }

    if (subtotal < coupon.minOrderAmount) {
      throw ApiError.badRequest(`Order subtotal must be at least ${coupon.minOrderAmount} EGP to use this coupon`);
    }

    // Check per-customer usage limit
    if (customerId || userEmail) {
      const match = coupon.customerUsage.find(
        (u) => (customerId && u.customer?.toString() === customerId.toString()) || (userEmail && u.email === userEmail)
      );
      if (match && match.usageCount >= coupon.maxUsesPerCustomer) {
        throw ApiError.badRequest(`You have already reached the maximum usage limit (${coupon.maxUsesPerCustomer}) for this coupon`);
      }
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      discount: Math.round(discount * 100) / 100,
      appliedCoupon: coupon
    };
  }
}

module.exports = new PromotionService();
