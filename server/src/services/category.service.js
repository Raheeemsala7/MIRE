const Category = require('../models/Category');
const { escapeRegex } = require('../utils/sanitize');
const ApiError = require('../utils/apiError');
const { recordAudit } = require('../utils/auditLogger');

class CategoryService {
  /**
   * Helper slug generator
   */
  generateSlug(name) {
    if (!name || typeof name !== 'string') return `category-${Date.now()}`;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .replace(/^-+|-+$/g, '');
    return slug || `category-${Date.now()}`;
  }

  async getAllCategories(query = {}) {
    // Backward compatibility if boolean passed directly
    if (typeof query === 'boolean') {
      const filter = query ? {} : { isActive: true };
      return Category.find(filter).populate('parentCategory', 'name slug').sort({ sortOrder: 1, name: 1 });
    }

    const { includeInactive, page, limit, search } = query;
    const isPaginated = page !== undefined || limit !== undefined || query.paginated === 'true';

    const filter = includeInactive === 'true' || includeInactive === true ? {} : { isActive: true };
    if (search) {
      const sanitized = escapeRegex(search);
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } }
      ];
    }

    if (!isPaginated) {
      const categories = await Category.find(filter)
        .populate('parentCategory', 'name slug')
        .sort({ sortOrder: 1, name: 1 });
      return { categories, isPaginated: false };
    }

    const { getPaginationOptions } = require('../utils/pagination');
    const { skip, limit: lim, page: p } = getPaginationOptions(query);

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate('parentCategory', 'name slug')
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(lim),
      Category.countDocuments(filter)
    ]);

    return { categories, total, page: p, limit: lim, isPaginated: true };
  }

  async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug }).populate('parentCategory', 'name slug');
    if (!category) {
      throw ApiError.notFound('Category not found');
    }
    return category;
  }

  async createCategory(data, performedBy) {
    const slug = data.slug && data.slug.trim()
      ? this.generateSlug(data.slug)
      : this.generateSlug(data.name);
    const existing = await Category.findOne({ $or: [{ name: data.name }, { slug }] });
    if (existing) {
      throw ApiError.conflict('A category with this name or slug already exists');
    }

    const category = await Category.create({
      ...data,
      slug
    });

    await recordAudit({
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category._id,
      performedBy,
      newState: category.toJSON()
    });

    return category;
  }

  async updateCategory(id, data, performedBy) {
    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    const previousState = category.toJSON();

    if (data.name && data.name !== category.name) {
      category.name = data.name;
      category.slug = data.slug && data.slug.trim()
        ? this.generateSlug(data.slug)
        : this.generateSlug(data.name);
    } else if (data.slug && data.slug.trim()) {
      category.slug = this.generateSlug(data.slug);
    }
    if (data.description !== undefined) category.description = data.description;
    if (data.image) category.image = data.image;
    if (data.parentCategory !== undefined) category.parentCategory = data.parentCategory;
    if (data.isActive !== undefined) category.isActive = data.isActive;
    if (data.sortOrder !== undefined) category.sortOrder = data.sortOrder;

    await category.save();

    await recordAudit({
      action: 'CATEGORY_UPDATED',
      entityType: 'Category',
      entityId: category._id,
      performedBy,
      previousState,
      newState: category.toJSON()
    });

    return category;
  }

  async deleteCategory(id, performedBy) {
    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parentCategory: id });
    if (childrenCount > 0) {
      throw ApiError.badRequest('Cannot delete category with active subcategories');
    }

    // Check if category has assigned products
    const { Product } = require('../models/Product');
    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
      throw ApiError.badRequest('Cannot delete category with assigned products');
    }

    await Category.findByIdAndDelete(id);

    await recordAudit({
      action: 'CATEGORY_DELETED',
      entityType: 'Category',
      entityId: id,
      performedBy
    });

    return true;
  }
}

module.exports = new CategoryService();
