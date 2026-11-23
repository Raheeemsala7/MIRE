const Customer = require('../models/Customer');
const { escapeRegex } = require('../utils/sanitize');
const { Order } = require('../models/Order');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationOptions } = require('../utils/pagination');

class CustomerController {
  async getCustomers(req, res, next) {
    try {
      const { page, limit, skip, sort } = getPaginationOptions(req.query);
      const filter = {};

      if (req.query.search) {
        const sanitized = escapeRegex(req.query.search);
        filter.$or = [
          { fullName: { $regex: sanitized, $options: 'i' } },
          { phone: { $regex: sanitized, $options: 'i' } },
          { email: { $regex: sanitized, $options: 'i' } }
        ];
      }

      const [customers, total] = await Promise.all([
        Customer.find(filter).sort(sort).skip(skip).limit(limit),
        Customer.countDocuments(filter)
      ]);

      return ApiResponse.paginated(res, {
        message: 'Customers retrieved successfully',
        data: customers,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) throw ApiError.notFound('Customer not found');

      const recentOrders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(10);

      return ApiResponse.success(res, {
        message: 'Customer retrieved',
        data: { customer, recentOrders }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const customer = await Customer.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
      if (!customer) throw ApiError.notFound('Customer not found');

      return ApiResponse.success(res, {
        message: 'Customer updated',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
