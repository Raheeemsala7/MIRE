const employeeService = require('../services/employee.service');
const ApiResponse = require('../utils/apiResponse');

class EmployeeController {
  async getEmployees(req, res, next) {
    try {
      const { employees, total, page, limit } = await employeeService.getEmployees(req.query);
      return ApiResponse.paginated(res, {
        message: 'Employees fetched successfully',
        data: employees,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeById(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      return ApiResponse.success(res, {
        message: 'Employee fetched successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async createEmployee(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body, req.user._id);
      return ApiResponse.created(res, {
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body, req.user._id);
      return ApiResponse.success(res, {
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleEmployeeStatus(req, res, next) {
    try {
      const employee = await employeeService.toggleEmployeeStatus(req.params.id, req.user._id);
      return ApiResponse.success(res, {
        message: `Employee status changed to ${employee.isActive ? 'active' : 'inactive'}`,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
