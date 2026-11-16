const ApiError = require('../utils/apiError');

/**
 * Require one or more specific roles
 * @param  {...string} roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

/**
 * Require a specific permission
 * @param {string} permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.user.hasPermission(permission)) {
      return next(ApiError.forbidden(`Missing required permission: ${permission}`));
    }

    next();
  };
};

module.exports = { requireRole, requirePermission };
