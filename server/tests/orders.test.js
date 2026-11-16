const mongoose = require('mongoose');
const env = require('../src/config/env');
const orderService = require('../src/services/order.service');
const cartService = require('../src/services/cart.service');
const { Product } = require('../src/models/Product');
const { Order, OrderStatuses } = require('../src/models/Order');

describe('Order Lifecycle & Reservation Tests', () => {
  let testProduct;
  const testSku = `ORD-SKU-${Date.now()}`;
  const testGuestId = `guest_test_${Date.now()}`;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    testProduct = await Product.create({
      name: 'Order Lifecycle Dress',
      slug: `order-lifecycle-dress-${Date.now()}`,
      sku: `ORD-BASE-${Date.now()}`,
      description: 'Test product for orders lifecycle',
      category: new mongoose.Types.ObjectId(),
      price: 1200,
      images: [{ url: 'https://example.com/dress.jpg' }],
      variants: [{ sku: testSku, color: 'Emerald', size: 'M', stockQuantity: 15 }]
    });
  });

  afterAll(async () => {
    if (testProduct) await Product.findByIdAndDelete(testProduct._id);
    await mongoose.connection.close();
  });

  it('should checkout cart, reserve stock, and transition through statuses', async () => {
    // 1. Add item to cart
    await cartService.addItem({
      guestId: testGuestId,
      productId: testProduct._id,
      variantSku: testSku,
      quantity: 2
    });

    // 2. Checkout
    const order = await orderService.createOrderFromCart({
      guestId: testGuestId,
      customerInfo: {
        fullName: 'Checkout Customer',
        phone: '+201098765432',
        email: 'checkout@example.com'
      },
      shippingAddress: {
        street: 'Nile St',
        city: 'Zamalek',
        governorate: 'Cairo'
      },
      paymentMethod: 'COD'
    });

    expect(order.orderNumber).toMatch(/^MIRE-\d{4}-\d{5}$/);
    expect(order.status).toBe(OrderStatuses.NEW);
    expect(order.items[0].quantity).toBe(2);

    // Verify stock decremented from 15 to 13
    const productAfterOrder = await Product.findById(testProduct._id);
    const variantAfterOrder = productAfterOrder.variants.find((v) => v.sku === testSku);
    expect(variantAfterOrder.stockQuantity).toBe(13);

    // 3. Status transition: NEW -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
    const confirmed = await orderService.updateOrderStatus(order._id, OrderStatuses.CONFIRMED, 'Payment confirmed');
    expect(confirmed.status).toBe(OrderStatuses.CONFIRMED);

    const shipped = await orderService.updateOrderStatus(order._id, OrderStatuses.SHIPPED, 'Out with courier');
    expect(shipped.status).toBe(OrderStatuses.SHIPPED);

    const delivered = await orderService.updateOrderStatus(order._id, OrderStatuses.DELIVERED, 'Customer received parcel');
    expect(delivered.status).toBe(OrderStatuses.DELIVERED);
    expect(delivered.paymentInfo.status).toBe('PAID'); // COD order marked paid on delivery

    // Cleanup
    await Order.findByIdAndDelete(order._id);
  });
});
