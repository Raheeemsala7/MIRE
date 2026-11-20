const Wishlist = require('../models/Wishlist');
const { Product } = require('../models/Product');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/pagination');

class WishlistService {
  /**
   * Get or create wishlist document for user
   */
  async getOrCreateWishlist(userId) {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, items: [] });
    }
    return wishlist;
  }

  /**
   * Retrieve user's wishlist with populated active product details & pagination
   */
  async getWishlist(userId, query = {}) {
    const { page, limit, skip } = getPaginationOptions(query);

    const wishlist = await this.getOrCreateWishlist(userId);

    // Populate active products
    await wishlist.populate({
      path: 'items.product',
      select: 'name slug sku price discountPrice images colors sizes variants status totalStock isFeatured isNewArrival'
    });

    // Filter out items whose product may have been permanently deleted
    const validItems = wishlist.items.filter((item) => item.product != null);

    // If cleaned, update silently
    if (validItems.length !== wishlist.items.length) {
      wishlist.items = validItems;
      await wishlist.save();
    }

    const total = validItems.length;
    const paginatedItems = validItems.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      wishlistId: wishlist._id
    };
  }

  /**
   * Add a product to the user's wishlist
   */
  async addToWishlist(userId, { productId, variantSku = null }) {
    const product = await Product.findById(productId);
    if (!product || product.status !== 'ACTIVE') {
      throw ApiError.notFound('Product not found or currently unavailable');
    }

    const wishlist = await this.getOrCreateWishlist(userId);

    const alreadyInWishlist = wishlist.items.some(
      (item) => item.product.toString() === productId.toString()
    );

    if (alreadyInWishlist) {
      return {
        message: 'Product is already in your wishlist',
        wishlist,
        inWishlist: true
      };
    }

    wishlist.items.unshift({
      product: product._id,
      variantSku: variantSku || null,
      addedAt: new Date()
    });

    await wishlist.save();

    await wishlist.populate({
      path: 'items.product',
      select: 'name slug sku price discountPrice images colors sizes status totalStock'
    });

    return {
      message: 'Product added to wishlist successfully',
      wishlist,
      inWishlist: true
    };
  }

  /**
   * Remove a product from the user's wishlist
   */
  async removeFromWishlist(userId, productId) {
    const wishlist = await this.getOrCreateWishlist(userId);

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    if (wishlist.items.length === initialLength) {
      // Also try by item subdocument _id if passed instead of productId
      wishlist.items = wishlist.items.filter(
        (item) => item._id.toString() !== productId.toString()
      );
    }

    await wishlist.save();

    return {
      message: 'Product removed from wishlist',
      wishlist,
      inWishlist: false
    };
  }

  /**
   * Check if a specific product is in user's wishlist
   */
  async checkWishlistStatus(userId, productId) {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return { inWishlist: false };
    }

    const inWishlist = wishlist.items.some(
      (item) => item.product.toString() === productId.toString()
    );

    return { inWishlist };
  }

  /**
   * Clear all items in user's wishlist
   */
  async clearWishlist(userId) {
    const wishlist = await this.getOrCreateWishlist(userId);
    wishlist.items = [];
    await wishlist.save();
    return {
      message: 'Wishlist cleared successfully'
    };
  }
}

module.exports = new WishlistService();
