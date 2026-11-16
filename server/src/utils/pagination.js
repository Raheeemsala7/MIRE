/**
 * Standardized Pagination Helper
 */
const getPaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (query.sortBy) {
    const parts = query.sortBy.split(':');
    sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
  }

  return { page, limit, skip, sort };
};

module.exports = { getPaginationOptions };
