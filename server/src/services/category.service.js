const Category = require('../models/Category');
const ApiError = require('../utils/apiError');
const { recordAudit } = require('../utils/auditLogger');

class CategoryService {
  /**
   * Helper slug generator
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
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
    const slug = this.generateSlug(data.name);
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
      category.slug = this.generateSlug(data.name);
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
