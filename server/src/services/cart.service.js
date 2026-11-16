const Cart = require('../models/Cart');
const { Product } = require('../models/Product');
const promotionService = require('./promotion.service');
const ApiError = require('../utils/apiError');

const SHIPPING_RATES = {
  Cairo: 50,
  Giza: 50,
  Alexandria: 60,
  Qalyubia: 65,
  Sharqia: 70,
  Dakahlia: 70,
  Gharbia: 70,
  Monufia: 70,
  Beheira: 70,
  'Kafr El Sheikh': 70,
  Damietta: 70,
  'Port Said': 70,
  Ismailia: 70,
  Suez: 70,
  'Beni Suef': 85,
  Faiyum: 85,
  Minya: 90,
  Asyut: 90,
  Sohag: 95,
  Qena: 95,
  Luxor: 100,
  Aswan: 100,
  'Red Sea': 110,
  'South Sinai': 110
};

const FREE_SHIPPING_THRESHOLD = 1500;

class CartService {
  getShippingFee(governorate, subtotal) {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    return SHIPPING_RATES[governorate] || 60;
  }

  async getOrCreateCart({ userId = null, guestId = null }) {
    if (!userId && !guestId) {
      throw ApiError.badRequest('Either userId or guestId is required to access cart');
    }

    const query = userId ? { user: userId } : { guestId };
    let cart = await Cart.findOne(query).populate('items.product', 'name slug sku price discountPrice images variants');

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        guestId: userId ? null : guestId,
        items: [],
        governorate: 'Cairo'
      });
    }

    // Merge guest cart if user just logged in
    if (userId && guestId) {
      const guestCart = await Cart.findOne({ guestId });
      if (guestCart && guestCart.items.length > 0) {
        for (const guestItem of guestCart.items) {
          const existingItemIndex = cart.items.findIndex((it) => it.variantSku === guestItem.variantSku);
          if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += guestItem.quantity;
          } else {
            cart.items.push(guestItem);
          }
        }
        await Cart.findByIdAndDelete(guestCart._id);
      }
    }

    return this.recalculateCart(cart);
  }

  async addItem({ userId, guestId, productId, variantSku, quantity }) {
    const product = await Product.findById(productId);
    if (!product || product.status !== 'ACTIVE') {
      throw ApiError.notFound('Product is unavailable or archived');
    }

    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant) {
      throw ApiError.notFound(`Variant ${variantSku} does not exist`);
    }

    if (variant.stockQuantity < quantity) {
      throw ApiError.badRequest(
        `Requested quantity (${quantity}) exceeds available stock (${variant.stockQuantity}) for ${variant.color} / ${variant.size}`
      );
    }

    const cart = await this.getOrCreateCart({ userId, guestId });

    const itemIndex = cart.items.findIndex((it) => it.variantSku === variantSku);
    const unitPrice = product.price;
    const discountPrice = product.discountPrice;
    const effectivePrice = discountPrice || unitPrice;

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (variant.stockQuantity < newQuantity) {
        throw ApiError.badRequest(`Cannot add more. Maximum available stock is ${variant.stockQuantity}`);
      }
      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].subtotal = effectivePrice * newQuantity;
    } else {
      cart.items.push({
        product: product._id,
        variantSku,
        color: variant.color,
        size: variant.size,
        quantity,
        unitPrice,
        discountPrice,
        subtotal: effectivePrice * quantity
      });
    }

    return this.recalculateCart(cart);
  }

  async updateItem({ userId, guestId, itemId, quantity }) {
    const cart = await this.getOrCreateCart({ userId, guestId });
    const item = cart.items.id(itemId);
    if (!item) throw ApiError.notFound('Item not in cart');

    const product = await Product.findById(item.product);
    const variant = product?.variants.find((v) => v.sku === item.variantSku);

    if (!variant || variant.stockQuantity < quantity) {
      throw ApiError.badRequest(`Requested quantity exceeds available stock (${variant?.stockQuantity || 0})`);
    }

    const effectivePrice = item.discountPrice || item.unitPrice;
    item.quantity = quantity;
    item.subtotal = effectivePrice * quantity;

    return this.recalculateCart(cart);
  }

  async removeItem({ userId, guestId, itemId }) {
    const cart = await this.getOrCreateCart({ userId, guestId });
    cart.items.pull(itemId);
    return this.recalculateCart(cart);
  }

  async applyBundle({ userId, guestId, bundleId }) {
    const cart = await this.getOrCreateCart({ userId, guestId });
    cart.appliedBundle = bundleId;
    return this.recalculateCart(cart);
  }

  async applyCoupon({ userId, guestId, couponCode }) {
    const cart = await this.getOrCreateCart({ userId, guestId });
    const { appliedCoupon } = await promotionService.evaluateCouponDiscount(
      couponCode,
      cart.subtotal,
      userId
    );
    cart.appliedCoupon = appliedCoupon._id;
    return this.recalculateCart(cart);
  }

  async removeCoupon({ userId, guestId }) {
    const cart = await this.getOrCreateCart({ userId, guestId });
    cart.appliedCoupon = null;
    return this.recalculateCart(cart);
  }

  async setGovernorate({ userId, guestId, governorate }) {
    const cart = await this.getOrCreateCart({ userId, guestId });
    cart.governorate = governorate;
    return this.recalculateCart(cart);
  }

  async clearCart({ userId = null, guestId = null }) {
    const query = userId ? { user: userId } : { guestId };
    await Cart.findOneAndUpdate(query, {
      items: [],
      appliedBundle: null,
      appliedCoupon: null,
      subtotal: 0,
      bundleDiscount: 0,
      couponDiscount: 0,
      shippingFee: 0,
      totalAmount: 0
    });
  }

  /**
   * Recalculate subtotal, bundle discounts, coupon discounts, shipping, and total amount
   */
  async recalculateCart(cart) {
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        item.unitPrice = product.price;
        item.discountPrice = product.discountPrice;
        const effectivePrice = item.discountPrice || item.unitPrice;
        item.subtotal = effectivePrice * item.quantity;
        subtotal += item.subtotal;
      }
    }

    cart.subtotal = Math.round(subtotal * 100) / 100;

    // 1. Calculate Bundle Discount
    let bundleDiscount = 0;
    if (cart.appliedBundle) {
      const bundleResult = await promotionService.evaluateBundleDiscount(cart.appliedBundle, cart.items);
      bundleDiscount = bundleResult.discount;
      if (!bundleResult.appliedBundle) {
        cart.appliedBundle = null;
      }
    }
    cart.bundleDiscount = bundleDiscount;

    // 2. Calculate Coupon Discount (on amount after bundle discount)
    let couponDiscount = 0;
    if (cart.appliedCoupon) {
      try {
        const Coupon = require('../models/Coupon');
        const couponDoc = await Coupon.findById(cart.appliedCoupon);
        if (couponDoc) {
          const couponResult = await promotionService.evaluateCouponDiscount(
            couponDoc.code,
            Math.max(0, cart.subtotal - bundleDiscount),
            cart.user
          );
          couponDiscount = couponResult.discount;
        } else {
          cart.appliedCoupon = null;
        }
      } catch {
        cart.appliedCoupon = null;
      }
    }
    cart.couponDiscount = couponDiscount;

    // 3. Shipping calculation
    const shippingFee = cart.items.length > 0 ? this.getShippingFee(cart.governorate, cart.subtotal) : 0;
    cart.shippingFee = shippingFee;

    // 4. Final total calculation
    const totalAmount = Math.max(0, cart.subtotal - bundleDiscount - couponDiscount + shippingFee);
    cart.totalAmount = Math.round(totalAmount * 100) / 100;

    await cart.save();
    return cart.populate('items.product', 'name slug sku price discountPrice images variants');
  }
}

module.exports = new CartService();
