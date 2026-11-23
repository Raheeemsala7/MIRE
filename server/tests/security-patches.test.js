const authService = require('../src/services/auth.service');
const { User, UserRoles } = require('../src/models/User');
const orderService = require('../src/services/order.service');
const orderController = require('../src/controllers/order.controller');
const cartController = require('../src/controllers/cart.controller');
const cartService = require('../src/services/cart.service');
const notificationController = require('../src/controllers/notification.controller');
const Notification = require('../src/models/Notification');
const paymentService = require('../src/services/payment.service');
const returnService = require('../src/services/return.service');
const employeeService = require('../src/services/employee.service');
const { Product } = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const { Order } = require('../src/models/Order');
const { escapeRegex } = require('../src/utils/sanitize');
const app = require('../src/app');
const request = require('supertest');

jest.mock('../src/models/User', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn()
  },
  UserRoles: {
    CUSTOMER: 'CUSTOMER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN'
  },
  DefaultRolePermissions: {
    ADMIN: ['MANAGE_ORDERS', 'VIEW_REPORTS'],
    SUPER_ADMIN: ['*']
  }
}));

jest.mock('../src/models/Product', () => ({
  Product: {
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.mock('../src/models/Customer');
jest.mock('../src/models/Notification', () => ({
  create: jest.fn().mockResolvedValue({})
}));
jest.mock('../src/models/Order', () => {
  const MockOrder = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  });
  MockOrder.countDocuments = jest.fn().mockResolvedValue(10);
  MockOrder.findById = jest.fn();
  MockOrder.findOne = jest.fn();
  return {
    Order: MockOrder,
    OrderStatuses: { PENDING: 'PENDING', NEW: 'NEW', DELIVERED: 'DELIVERED' },
    PaymentMethods: { COD: 'COD' },
    PaymentStatuses: { PENDING: 'PENDING' }
  };
});
jest.mock('../src/models/Cart');
jest.mock('../src/utils/auditLogger', () => ({
  recordAudit: jest.fn().mockResolvedValue(true)
}));

describe('Security Verification & Regression Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MIRE-SEC-001: Password reset token exposure fix', () => {
    it('PROVES FIX: forgotPassword never exposes resetToken in return object for existing user', async () => {
      const mockUser = {
        email: 'victim@example.com',
        createPasswordResetToken: jest.fn().mockReturnValue('super_secret_reset_token'),
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.forgotPassword('victim@example.com');

      expect(result).not.toHaveProperty('resetToken');
      expect(result.message).toBe('If an account exists with this email, a reset link will be sent.');
      expect(mockUser.createPasswordResetToken).toHaveBeenCalledTimes(1);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    it('PROVES FIX: forgotPassword returns identical message when user does not exist (no enumeration)', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await authService.forgotPassword('nonexistent@example.com');

      expect(result).not.toHaveProperty('resetToken');
      expect(result.message).toBe('If an account exists with this email, a reset link will be sent.');
    });
  });

  describe('MIRE-SEC-002: Arbitrary client-controlled unit price fix', () => {
    it('PROVES FIX: createOrderFromCart ignores client-supplied price and enforces database catalog price', async () => {
      const mockCustomer = {
        _id: 'cust_123',
        fullName: 'Test Customer',
        phone: '01012345678',
        totalOrders: 0,
        totalSpent: 0,
        save: jest.fn().mockResolvedValue(true)
      };
      Customer.findOne.mockResolvedValue(mockCustomer);

      // Authoritative catalog price in database is 1500
      Product.findById.mockResolvedValue({
        _id: 'prod_123',
        name: 'Luxury Silk Dress',
        price: 1500,
        discountPrice: null,
        finalPrice: 1500,
        status: 'ACTIVE',
        variants: [{ sku: 'SKU-SILK-M', stockQuantity: 50 }]
      });

      // Attacker attempts to purchase at price: 0.01
      const order = await orderService.createOrderFromCart({
        customerInfo: { fullName: 'Attacker', phone: '01012345678' },
        shippingAddress: { street: '123 Fake St', city: 'Cairo', governorate: 'Cairo' },
        items: [
          {
            productId: 'prod_123',
            name: 'Luxury Silk Dress',
            variantSku: 'SKU-SILK-M',
            price: 0.01,
            unitPrice: 0.01,
            quantity: 2
          }
        ]
      });

      // Verified: unitPrice is 1500 from catalog, subtotal is 3000 (NOT 0.02)
      expect(order.items[0].unitPrice).toBe(1500);
      expect(order.pricing.subtotal).toBe(3000);
    });

    it('PROVES REGRESSION: rejects orders with inactive or non-existent products', async () => {
      Product.findById.mockResolvedValue(null);

      await expect(
        orderService.createOrderFromCart({
          customerInfo: { fullName: 'Attacker', phone: '01012345678' },
          shippingAddress: { street: '123 Fake St', city: 'Cairo', governorate: 'Cairo' },
          items: [{ productId: 'non_existent_prod', quantity: 1 }]
        })
      ).rejects.toThrow('unavailable');
    });
  });

  describe('MIRE-SEC-003: Employee RBAC privilege escalation fix', () => {
    it('PROVES FIX: forbids non-SUPER_ADMIN employee from escalating to SUPER_ADMIN', async () => {
      const targetEmployee = {
        _id: 'emp_123',
        name: 'Regular Admin',
        role: 'ADMIN',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ _id: 'emp_123', role: 'ADMIN' })
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(targetEmployee)
      });

      // Caller is an ADMIN employee
      const callerAdmin = { _id: 'caller_admin_456', role: 'ADMIN' };

      await expect(
        employeeService.updateEmployee('emp_123', { role: 'SUPER_ADMIN' }, callerAdmin)
      ).rejects.toThrow('Only Super Admin can assign or change employee roles');
    });

    it('PROVES FIX: forbids non-SUPER_ADMIN from changing another employee password', async () => {
      const targetEmployee = {
        _id: 'emp_123',
        name: 'Victim Admin',
        role: 'ADMIN',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ _id: 'emp_123', role: 'ADMIN' })
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(targetEmployee)
      });

      const callerAdmin = { _id: 'caller_admin_456', role: 'ADMIN' };

      await expect(
        employeeService.updateEmployee('emp_123', { password: 'HackedPassword123!' }, callerAdmin)
      ).rejects.toThrow('Cannot modify password of another employee');
    });

    it('PROVES REGRESSION: allows SUPER_ADMIN to update roles and manage staff', async () => {
      const targetEmployee = {
        _id: 'emp_123',
        name: 'Regular Admin',
        role: 'ADMIN',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ _id: 'emp_123', role: 'ADMIN' })
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(targetEmployee)
      });

      const callerSuperAdmin = { _id: 'super_admin_root', role: 'SUPER_ADMIN' };

      const updated = await employeeService.updateEmployee('emp_123', { name: 'Updated Name' }, callerSuperAdmin);
      expect(updated.name).toBe('Updated Name');
    });
  });

  describe('MIRE-SEC-008: Customer account pollution parameter overwrite fix', () => {
    it('PROVES FIX: authenticated req.user._id cannot be overwritten by client-supplied req.body.userId', async () => {
      let passedData = null;
      jest.spyOn(orderService, 'createOrderFromCart').mockImplementation(async (data) => {
        passedData = data;
        return {
          _id: 'ord_123',
          orderNumber: 'ORD-1234',
          paymentInfo: { method: 'COD' }
        };
      });

      const req = {
        user: { _id: 'authenticated_user_789' },
        headers: {},
        body: {
          userId: 'malicious_injected_victim_id',
          customerInfo: { fullName: 'Test Customer', phone: '01012345678' },
          shippingAddress: { street: '123 St', city: 'Cairo', governorate: 'Cairo' }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await orderController.checkout(req, res, next);

      // Verified: req.body.userId is overridden; authenticated user ID is preserved!
      expect(passedData.userId).toBe('authenticated_user_789');
    });
  });

  describe('MIRE-SEC-005: CORS origin restriction fix', () => {
    it('PROVES FIX: CORS rejects arbitrary untrusted origin', async () => {
      const res = await request(app)
        .options('/api/v1/auth/me')
        .set('Origin', 'https://malicious-site.example')
        .set('Access-Control-Request-Method', 'GET');

      // Untrusted origin is not reflected in Access-Control-Allow-Origin
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('MIRE-SEC-007: Database regex escaping utility (ReDoS prevention)', () => {
    it('PROVES FIX: escapeRegex neutralizes regex metacharacters', () => {
      const maliciousPattern = '((a+)+)+$';
      const escaped = escapeRegex(maliciousPattern);

      expect(escaped).toBe('\\(\\(a\\+\\)\\+\\)\\+\\$');
      // Verifies that escaped pattern safely compiles as literal without catastrophic backtracking
      const regex = new RegExp(escaped, 'i');
      expect(regex.test('((a+)+)+$')).toBe(true);
      expect(regex.test('aaaa')).toBe(false);
    });

    it('PROVES FIX: escapeRegex handles all regex control characters safely', () => {
      const specialChars = '.*+?^${}()|[]\\';
      const escaped = escapeRegex(specialChars);

      expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });
  });

  describe('MIRE-SEC-008 (Variant): Cart parameter pollution fix', () => {
    it('PROVES FIX: CartController.addItem prevents req.body.userId from overriding session userId', async () => {
      let passedData = null;
      jest.spyOn(cartService, 'addItem').mockImplementation(async (data) => {
        passedData = data;
        return { items: [] };
      });

      const req = {
        user: { _id: 'authenticated_cart_owner' },
        headers: {},
        query: {},
        body: {
          productId: 'prod_999',
          quantity: 1,
          userId: 'malicious_cart_target_user'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await cartController.addItem(req, res, next);

      expect(passedData.userId).toBe('authenticated_cart_owner');
    });
  });

  describe('MIRE-SEC-009: Notification IDOR fix', () => {
    it('PROVES FIX: markAsRead rejects modifying notification when recipient does not match', async () => {
      Notification.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      const req = {
        params: { id: 'notif_of_user_b' },
        user: { _id: 'user_a_id', role: 'CUSTOMER' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await notificationController.markAsRead(req, res, next);

      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'notif_of_user_b',
          $or: expect.arrayContaining([{ recipientUser: 'user_a_id' }])
        }),
        expect.any(Object)
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('MIRE-SEC-010: Payment session access control fix', () => {
    it('PROVES FIX: createPaymentSession blocks unauthenticated callers from paying for an authenticated user order', async () => {
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'ord_private_123',
          user: 'user_owner_id',
          paymentInfo: { status: 'PENDING', method: 'COD' },
          pricing: { totalAmount: 500 }
        })
      });

      // Unauthenticated caller (user = null)
      await expect(
        paymentService.createPaymentSession('ord_private_123', 'COD', null, null, null)
      ).rejects.toThrow('Authentication required');
    });

    it('PROVES FIX: createPaymentSession blocks unauthorized customer from paying for another user order', async () => {
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'ord_private_123',
          user: 'user_owner_id',
          paymentInfo: { status: 'PENDING', method: 'COD' },
          pricing: { totalAmount: 500 }
        })
      });

      const unauthorizedCustomer = { _id: 'different_user_id', role: 'CUSTOMER' };

      await expect(
        paymentService.createPaymentSession('ord_private_123', 'COD', null, null, unauthorizedCustomer)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('MIRE-SEC-011: Guest return verification fix', () => {
    it('PROVES FIX: requestReturn rejects guest return when phone number does not match order', async () => {
      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'guest_ord_1',
          orderNumber: 'MIRE-2026-00001',
          user: null,
          customer: { phone: '01012345678' },
          customerInfo: { phone: '01012345678' },
          status: 'DELIVERED',
          items: [{ sku: 'SKU-1', unitPrice: 100 }]
        })
      });

      // Attacker provides wrong phone number
      await expect(
        returnService.requestReturn({
          orderId: 'guest_ord_1',
          customerPhone: '01099999999',
          items: [{ sku: 'SKU-1', quantity: 1, reason: 'DEFECTIVE' }]
        })
      ).rejects.toThrow('Verification required');
    });
  });
});
