const { User, UserRoles, DefaultRolePermissions } = require('../models/User');
const ApiError = require('../utils/apiError');
const { getPaginationOptions } = require('../utils/pagination');
const { recordAudit } = require('../utils/auditLogger');

class EmployeeService {
  /**
   * List all employees/staff
   */
  async getEmployees(query) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {
      role: { $in: [
        UserRoles.SUPER_ADMIN,
        UserRoles.ADMIN,
        UserRoles.ORDER_MANAGER,
        UserRoles.CUSTOMER_SUPPORT,
        UserRoles.INVENTORY_MANAGER,
        UserRoles.ACCOUNTANT
      ] }
    };

    if (query.role) {
      filter.role = query.role;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ];
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const [employees, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    return { employees, total, page, limit };
  }

  /**
   * Get single employee by ID
   */
  async getEmployeeById(id) {
    const employee = await User.findById(id);
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }
    return employee;
  }

  /**
   * Create a new employee
   */
  async createEmployee(data, performedBy) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const permissions = (data.permissions && data.permissions.length > 0)
      ? data.permissions
      : DefaultRolePermissions[data.role] || [];

    const employee = await User.create({
      ...data,
      permissions
    });

    await recordAudit({
      action: 'EMPLOYEE_CREATED',
      entityType: 'User',
      entityId: employee._id,
      performedBy,
      newState: employee.toJSON()
    });

    return employee;
  }

  /**
   * Update employee details, role, permissions, status
   */
  async updateEmployee(id, data, performedBy) {
    const employee = await User.findById(id).select('+password');
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    if (employee.role === UserRoles.SUPER_ADMIN && data.role && data.role !== UserRoles.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot downgrade Super Admin role');
    }

    const previousState = employee.toJSON();

    if (data.name) employee.name = data.name;
    if (data.phone !== undefined) employee.phone = data.phone;
    if (data.role) {
      employee.role = data.role;
      if (!data.permissions) {
        employee.permissions = DefaultRolePermissions[data.role] || [];
      }
    }
    if (data.permissions) employee.permissions = data.permissions;
    if (data.isActive !== undefined) employee.isActive = data.isActive;
    if (data.password) employee.password = data.password;

    await employee.save();

    await recordAudit({
      action: 'EMPLOYEE_UPDATED',
      entityType: 'User',
      entityId: employee._id,
      performedBy,
      previousState,
      newState: employee.toJSON()
    });

    return employee;
  }

  /**
   * Deactivate/Delete employee
   */
  async toggleEmployeeStatus(id, performedBy) {
    const employee = await User.findById(id);
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    if (employee.role === UserRoles.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot deactivate Super Admin account');
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    await recordAudit({
      action: 'EMPLOYEE_STATUS_TOGGLED',
      entityType: 'User',
      entityId: employee._id,
      performedBy,
      details: { isActive: employee.isActive }
    });

    return employee;
  }
}

module.exports = new EmployeeService();
