const productService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');

class ProductController {
  async getAll(req, res, next) {
    try {
      const { products, total, page, limit } = await productService.getAllProducts(req.query);
      return ApiResponse.paginated(res, {
        message: 'Products fetched successfully',
        data: products,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const product = await productService.getProductBySlug(req.params.slug);
      return ApiResponse.success(res, {
        message: 'Product retrieved successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return ApiResponse.success(res, {
        message: 'Product retrieved successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async getRelated(req, res, next) {
    try {
      const related = await productService.getRelatedProducts(req.params.id);
      return ApiResponse.success(res, {
        message: 'Related products fetched successfully',
        data: related
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body, req.user._id);
      return ApiResponse.created(res, {
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body, req.user._id);
      return ApiResponse.success(res, {
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id, req.user._id);
      return ApiResponse.success(res, {
        message: 'Product archived successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
