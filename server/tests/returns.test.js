const mongoose = require('mongoose');
const env = require('../src/config/env');
const returnService = require('../src/services/return.service');
const Customer = require('../src/models/Customer');
const { Order, OrderStatuses } = require('../src/models/Order');
const { Product } = require('../src/models/Product');
const { Return, ReturnStatuses } = require('../src/models/Return');

describe('Returns & Restock Inspection Tests', () => {
  let testOrder;
  let testProduct;
  let testCustomer;
  const testSku = `RET-SKU-${Date.now()}`;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    testCustomer = await Customer.create({
      fullName: 'Return Tester',
      phone: `+2010${Date.now().toString().slice(-8)}`
    });

    testProduct = await Product.create({
      name: 'Returnable Dress',
      slug: `returnable-dress-${Date.now()}`,
      sku: `RET-BASE-${Date.now()}`,
      description: 'Test product for returns',
      category: new mongoose.Types.ObjectId(),
      price: 1500,
      images: [{ url: 'https://example.com/dress.jpg' }],
      variants: [{ sku: testSku, color: 'Black', size: 'M', stockQuantity: 20 }]
    });

    testOrder = await Order.create({
      orderNumber: `TEST-ORD-${Date.now()}`,
      customer: testCustomer._id,
      customerInfo: { fullName: 'Return Tester', phone: testCustomer.phone },
      shippingAddress: { street: 'Main St', city: 'Cairo', governorate: 'Cairo' },
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          sku: testSku,
          color: 'Black',
          size: 'M',
          quantity: 2,
          unitPrice: 1500,
          subtotal: 3000
        }
      ],
      pricing: { subtotal: 3000, shippingFee: 50, totalAmount: 3050 },
      status: OrderStatuses.DELIVERED
    });
  });

  afterAll(async () => {
    if (testCustomer) await Customer.findByIdAndDelete(testCustomer._id);
    if (testOrder) await Order.findByIdAndDelete(testOrder._id);
    if (testProduct) await Product.findByIdAndDelete(testProduct._id);
    await mongoose.connection.close();
  });

  it('should request return for delivered order', async () => {
    const returnDoc = await returnService.requestReturn({
      originalOrderId: testOrder._id,
      items: [
        {
          productId: testProduct._id,
          sku: testSku,
          color: 'Black',
          size: 'M',
          quantity: 1,
          unitPrice: 1500
        }
      ],
      reason: 'SIZE_TOO_LARGE'
    });

    expect(returnDoc).toBeDefined();
    expect(returnDoc.status).toBe(ReturnStatuses.RETURN_REQUESTED);
    expect(returnDoc.refundAmount).toBe(1500);

    // CRITICAL: Stock should NOT be restored at the REQUEST stage!
    const productBeforeInspection = await Product.findById(testProduct._id);
    const variantBefore = productBeforeInspection.variants.find((v) => v.sku === testSku);
    expect(variantBefore.stockQuantity).toBe(20);

    // Now inspect return with restockApproved: true
    const inspectedReturn = await returnService.inspectReturn(
      returnDoc._id,
      {
        inspectionNotes: 'Dress is in unworn perfect condition with tags attached.',
        itemInspections: [
          {
            itemId: returnDoc.items[0]._id.toString(),
            condition: 'TAGS_ATTACHED',
            restockApproved: true
          }
        ]
      },
      new mongoose.Types.ObjectId()
    );

    expect(inspectedReturn.status).toBe(ReturnStatuses.INSPECTED);

    // Stock MUST now be restored (+1 -> 21)
    const productAfterInspection = await Product.findById(testProduct._id);
    const variantAfter = productAfterInspection.variants.find((v) => v.sku === testSku);
    expect(variantAfter.stockQuantity).toBe(21);

    await Return.findByIdAndDelete(returnDoc._id);
  });
});
