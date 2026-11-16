const categoryService = require('../services/category.service');
const ApiResponse = require('../utils/apiResponse');

class CategoryController {
  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await categoryService.getAllCategories(includeInactive);
      return ApiResponse.success(res, {
        message: 'Categories fetched successfully',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      return ApiResponse.success(res, {
        message: 'Category fetched successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body, req.user._id);
      return ApiResponse.created(res, {
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body, req.user._id);
      return ApiResponse.success(res, {
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id, req.user._id);
      return ApiResponse.success(res, {
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
