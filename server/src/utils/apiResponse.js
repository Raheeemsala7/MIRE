/**
 * Unified API Response Builder
 */
class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
    const response = {
      success: true,
      statusCode,
      message,
      data
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  static created(res, { message = 'Resource created successfully', data = null, meta = null } = {}) {
    return this.success(res, { statusCode: 201, message, data, meta });
  }

  static paginated(res, { message = 'Fetched successfully', data = [], page = 1, limit = 20, total = 0, meta = null } = {}) {
    const totalPages = Math.ceil(total / limit) || 1;
    return this.success(res, {
      statusCode: 200,
      message,
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        ...(meta && typeof meta === 'object' ? meta : {})
      }
    });
  }
}

module.exports = ApiResponse;
