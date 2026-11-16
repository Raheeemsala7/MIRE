const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = require('../config/env');
const { User, UserRoles, DefaultRolePermissions } = require('../models/User');
const Customer = require('../models/Customer');
const Category = require('../models/Category');
const { Product } = require('../models/Product');
const { Bundle, BundleTypes } = require('../models/Bundle');
const Coupon = require('../models/Coupon');
const { Order, OrderStatuses, PaymentMethods, PaymentStatuses } = require('../models/Order');
const { Return, ReturnStatuses } = require('../models/Return');
const { Conversation, ConversationStatuses } = require('../models/Conversation');
const Message = require('../models/Message');
const SocialAccount = require('../models/SocialAccount');
const InventoryMovement = require('../models/InventoryMovement');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const seedData = async () => {
  try {
    logger.info('Connecting to MongoDB for seeding...');
    await mongoose.connect(env.MONGODB_URI);

    logger.info('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Bundle.deleteMany({}),
      Coupon.deleteMany({}),
      Order.deleteMany({}),
      Return.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      SocialAccount.deleteMany({}),
      InventoryMovement.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // 1. Seed Staff & Demo Users
    logger.info('Seeding staff and demo users...');
    const superAdmin = await User.create({
      name: 'Mirella Haddad (Super Admin)',
      email: 'superadmin@mirefashion.com',
      password: 'AdminPassword123!',
      phone: '+201000000001',
      role: UserRoles.SUPER_ADMIN,
      permissions: ['*'],
      isActive: true
    });

    const admin = await User.create({
      name: 'Salma El-Sherif (Admin)',
      email: 'admin@mirefashion.com',
      password: 'AdminPassword123!',
      phone: '+201000000002',
      role: UserRoles.ADMIN,
      permissions: DefaultRolePermissions[UserRoles.ADMIN],
      isActive: true
    });

    const orderManager = await User.create({
      name: 'Ahmed Tarek (Order Manager)',
      email: 'orders@mirefashion.com',
      password: 'StaffPassword123!',
      phone: '+201000000003',
      role: UserRoles.ORDER_MANAGER,
      permissions: DefaultRolePermissions[UserRoles.ORDER_MANAGER],
      isActive: true
    });

    const supportAgent = await User.create({
      name: 'Farida Kamel (Customer Support)',
      email: 'support@mirefashion.com',
      password: 'StaffPassword123!',
      phone: '+201000000004',
      role: UserRoles.CUSTOMER_SUPPORT,
      permissions: DefaultRolePermissions[UserRoles.CUSTOMER_SUPPORT],
      isActive: true
    });

    const inventoryManager = await User.create({
      name: 'Mostafa Zaki (Inventory)',
      email: 'inventory@mirefashion.com',
      password: 'StaffPassword123!',
      phone: '+201000000005',
      role: UserRoles.INVENTORY_MANAGER,
      permissions: DefaultRolePermissions[UserRoles.INVENTORY_MANAGER],
      isActive: true
    });

    const accountant = await User.create({
      name: 'Dina Raafat (Accountant)',
      email: 'finance@mirefashion.com',
      password: 'StaffPassword123!',
      phone: '+201000000006',
      role: UserRoles.ACCOUNTANT,
      permissions: DefaultRolePermissions[UserRoles.ACCOUNTANT],
      isActive: true
    });

    const customerUser = await User.create({
      name: 'Nour El-Din (Customer)',
      email: 'nour@example.com',
      password: 'CustomerPassword123!',
      phone: '+201112233445',
      role: UserRoles.CUSTOMER,
      permissions: DefaultRolePermissions[UserRoles.CUSTOMER],
      isActive: true
    });

    // 2. Seed Customers
    logger.info('Seeding customer profiles...');
    const customer1 = await Customer.create({
      user: customerUser._id,
      fullName: 'Nour El-Din',
      email: 'nour@example.com',
      phone: '+201112233445',
      addresses: [
        {
          street: '18 Gezira Street',
          building: 'Tower 4',
          apartment: '12B',
          city: 'Zamalek',
          governorate: 'Cairo',
          postalCode: '11561',
          country: 'Egypt',
          isDefault: true
        }
      ],
      totalOrders: 3,
      totalSpent: 4850,
      tags: ['VIP', 'Repeat Buyer']
    });

    const customer2 = await Customer.create({
      fullName: 'Yasmin Sabry',
      email: 'yasmin.s@example.com',
      phone: '+201099887766',
      addresses: [
        {
          street: '45 Stanley Bridge Corniche',
          city: 'Alexandria',
          governorate: 'Alexandria',
          country: 'Egypt',
          isDefault: true
        }
      ],
      totalOrders: 1,
      totalSpent: 1650,
      tags: ['New Customer']
    });

    // 3. Seed Categories
    logger.info('Seeding categories...');
    const catEvening = await Category.create({
      name: 'Evening Dresses',
      slug: 'evening-dresses',
      description: 'Sophisticated floor-length gowns and luxury satin silhouettes for special occasions.',
      image: { url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80' },
      sortOrder: 1
    });

    const catModest = await Category.create({
      name: 'Modest Wear & Abayas',
      slug: 'modest-wear-abayas',
      description: 'Contemporary crepe and chiffon modest ensembles, kaftans and luxury abayas.',
      image: { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80' },
      sortOrder: 2
    });

    const catTops = await Category.create({
      name: 'Tops & Blouses',
      slug: 'tops-blouses',
      description: 'Hand-tailored silk shirts, draped organza tops and everyday luxury knitwear.',
      image: { url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80' },
      sortOrder: 3
    });

    const catAccessories = await Category.create({
      name: 'Luxury Accessories',
      slug: 'luxury-accessories',
      description: 'Pure silk scarves, pearl brooches, and designer leather clutches.',
      image: { url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80' },
      sortOrder: 4
    });

    // 4. Seed Products
    logger.info('Seeding products with variant stock...');
    const product1 = await Product.create({
      name: 'Aurelia Draped Satin Evening Gown',
      slug: 'aurelia-draped-satin-evening-gown',
      sku: 'MIRE-DRS-001',
      description: 'A timeless silhouette meticulously tailored in liquid rose satin with asymmetrical cowl draping and delicate pearl buttons.',
      category: catEvening._id,
      brand: 'MIRE Couture',
      price: 2450,
      discountPrice: 2150,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
          isPrimary: true
        },
        {
          url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
          isPrimary: false
        }
      ],
      colors: [
        { name: 'Rose Quartz', code: '#f43f5e' },
        { name: 'Champagne Gold', code: '#e2d3b3' }
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      variants: [
        { sku: 'MIRE-DRS-001-RQ-S', color: 'Rose Quartz', size: 'S', stockQuantity: 12 },
        { sku: 'MIRE-DRS-001-RQ-M', color: 'Rose Quartz', size: 'M', stockQuantity: 8 },
        { sku: 'MIRE-DRS-001-RQ-L', color: 'Rose Quartz', size: 'L', stockQuantity: 4 }, // low stock
        { sku: 'MIRE-DRS-001-CG-S', color: 'Champagne Gold', size: 'S', stockQuantity: 10 },
        { sku: 'MIRE-DRS-001-CG-M', color: 'Champagne Gold', size: 'M', stockQuantity: 15 },
        { sku: 'MIRE-DRS-001-CG-L', color: 'Champagne Gold', size: 'L', stockQuantity: 6 }
      ],
      lowStockThreshold: 5,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      tags: ['Evening', 'Satin', 'Gown', 'Couture', 'Luxury']
    });

    const product2 = await Product.create({
      name: 'Noor Emerald Embellished Velvet Abaya',
      slug: 'noor-emerald-embellished-velvet-abaya',
      sku: 'MIRE-ABY-002',
      description: 'Lustrous emerald velvet abaya with artisanal gold thread embroidery along the lapels and cuffs. Includes matching chiffon sheila.',
      category: catModest._id,
      brand: 'MIRE Modest',
      price: 2850,
      discountPrice: 2490,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
          isPrimary: true
        }
      ],
      colors: [
        { name: 'Emerald Velvet', code: '#064e3b' },
        { name: 'Onyx Black', code: '#18181b' }
      ],
      sizes: ['M', 'L', 'XL'],
      variants: [
        { sku: 'MIRE-ABY-002-EV-M', color: 'Emerald Velvet', size: 'M', stockQuantity: 14 },
        { sku: 'MIRE-ABY-002-EV-L', color: 'Emerald Velvet', size: 'L', stockQuantity: 9 },
        { sku: 'MIRE-ABY-002-OB-M', color: 'Onyx Black', size: 'M', stockQuantity: 20 },
        { sku: 'MIRE-ABY-002-OB-L', color: 'Onyx Black', size: 'L', stockQuantity: 15 }
      ],
      lowStockThreshold: 5,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      tags: ['Modest', 'Abaya', 'Velvet', 'Embroidery']
    });

    const product3 = await Product.create({
      name: 'Celeste Pleated Silk Chiffon Blouse',
      slug: 'celeste-pleated-silk-chiffon-blouse',
      sku: 'MIRE-TOP-003',
      description: 'Airy silk chiffon blouse featuring micro-accordion pleating, voluminous poet sleeves, and a removable neck pussy-bow.',
      category: catTops._id,
      brand: 'MIRE Prêt',
      price: 1250,
      discountPrice: 990,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=900&q=80',
          isPrimary: true
        }
      ],
      colors: [
        { name: 'Ivory Pearl', code: '#fafaf9' },
        { name: 'Blush Mist', code: '#ffe4e6' }
      ],
      sizes: ['XS', 'S', 'M', 'L'],
      variants: [
        { sku: 'MIRE-TOP-003-IP-S', color: 'Ivory Pearl', size: 'S', stockQuantity: 18 },
        { sku: 'MIRE-TOP-003-IP-M', color: 'Ivory Pearl', size: 'M', stockQuantity: 12 },
        { sku: 'MIRE-TOP-003-BM-S', color: 'Blush Mist', size: 'S', stockQuantity: 3 }, // low stock
        { sku: 'MIRE-TOP-003-BM-M', color: 'Blush Mist', size: 'M', stockQuantity: 10 }
      ],
      lowStockThreshold: 5,
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      tags: ['Silk', 'Blouse', 'Pleated', 'Chic']
    });

    // 5. Seed Initial Stock Movements
    logger.info('Seeding initial stock movements...');
    for (const prod of [product1, product2, product3]) {
      for (const v of prod.variants) {
        await InventoryMovement.create({
          product: prod._id,
          variantSku: v.sku,
          color: v.color,
          size: v.size,
          type: 'PURCHASE',
          quantityChange: v.stockQuantity,
          previousStock: 0,
          newStock: v.stockQuantity,
          reason: 'Initial Inventory Stock Inward',
          performedBy: inventoryManager._id
        });
      }
    }

    // 6. Seed Bundles & Promotions
    logger.info('Seeding promotional bundles and coupons...');
    await Bundle.create({
      title: 'Duo Elegance: Any 2 Evening Gowns for 3,899 EGP',
      slug: 'duo-elegance-evening-gowns',
      description: 'Select any 2 luxury evening dresses from our collection and enjoy exclusive bundle pricing.',
      type: BundleTypes.FIXED_PRICE,
      eligibleCategories: [catEvening._id],
      eligibleProducts: [product1._id],
      requiredQuantity: 2,
      bundlePrice: 3899,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 500,
      usedCount: 14,
      maxUsesPerCustomer: 2,
      isActive: true
    });

    await Bundle.create({
      title: 'Buy 2 Blouses Get 20% Off',
      slug: 'buy-2-blouses-20-off',
      description: 'Upgrade your work-to-evening wardrobe with 20% off when purchasing two or more blouses.',
      type: BundleTypes.PERCENTAGE,
      eligibleCategories: [catTops._id],
      requiredQuantity: 2,
      discountPercentage: 20,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true
    });

    await Coupon.create({
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 1000,
      maxDiscountAmount: 300,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 1000,
      maxUsesPerCustomer: 1,
      isActive: true
    });

    await Coupon.create({
      code: 'MIREVIP',
      discountType: 'FIXED_AMOUNT',
      discountValue: 200,
      minOrderAmount: 1500,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 200,
      maxUsesPerCustomer: 1,
      isActive: true
    });

    // 7. Seed Orders & Status Lifecycles
    logger.info('Seeding orders...');
    const order1 = await Order.create({
      orderNumber: 'MIRE-2026-00001',
      customer: customer1._id,
      user: customerUser._id,
      customerInfo: {
        fullName: 'Nour El-Din',
        email: 'nour@example.com',
        phone: '+201112233445'
      },
      shippingAddress: {
        street: '18 Gezira Street',
        city: 'Zamalek',
        governorate: 'Cairo',
        country: 'Egypt'
      },
      items: [
        {
          product: product1._id,
          name: product1.name,
          sku: 'MIRE-DRS-001-RQ-M',
          color: 'Rose Quartz',
          size: 'M',
          quantity: 1,
          unitPrice: 2150,
          subtotal: 2150
        }
      ],
      pricing: {
        subtotal: 2150,
        bundleDiscount: 0,
        couponDiscount: 200,
        shippingFee: 0, // free shipping over 1500
        totalAmount: 1950
      },
      paymentInfo: {
        method: PaymentMethods.STRIPE,
        status: PaymentStatuses.PAID,
        transactionId: 'pi_mock_stripe_001',
        paidAt: new Date(Date.now() - 3 * 86400000)
      },
      status: OrderStatuses.DELIVERED,
      assignedEmployee: orderManager._id,
      statusHistory: [
        { status: OrderStatuses.NEW, reason: 'Order placed online', timestamp: new Date(Date.now() - 4 * 86400000) },
        { status: OrderStatuses.CONFIRMED, changedBy: orderManager._id, reason: 'Payment confirmed via Stripe', timestamp: new Date(Date.now() - 3.8 * 86400000) },
        { status: OrderStatuses.PROCESSING, changedBy: orderManager._id, reason: 'Packaging items in luxury box', timestamp: new Date(Date.now() - 3 * 86400000) },
        { status: OrderStatuses.SHIPPED, changedBy: orderManager._id, reason: 'Dispatched with courier', timestamp: new Date(Date.now() - 2 * 86400000) },
        { status: OrderStatuses.DELIVERED, changedBy: orderManager._id, reason: 'Delivered and signed by customer', timestamp: new Date(Date.now() - 1 * 86400000) }
      ],
      createdAt: new Date(Date.now() - 4 * 86400000)
    });

    const order2 = await Order.create({
      orderNumber: 'MIRE-2026-00002',
      customer: customer2._id,
      customerInfo: {
        fullName: 'Yasmin Sabry',
        email: 'yasmin.s@example.com',
        phone: '+201099887766'
      },
      shippingAddress: {
        street: '45 Stanley Bridge Corniche',
        city: 'Alexandria',
        governorate: 'Alexandria',
        country: 'Egypt'
      },
      items: [
        {
          product: product2._id,
          name: product2.name,
          sku: 'MIRE-ABY-002-EV-M',
          color: 'Emerald Velvet',
          size: 'M',
          quantity: 1,
          unitPrice: 2490,
          subtotal: 2490
        }
      ],
      pricing: {
        subtotal: 2490,
        bundleDiscount: 0,
        couponDiscount: 0,
        shippingFee: 0,
        totalAmount: 2490
      },
      paymentInfo: {
        method: PaymentMethods.COD,
        status: PaymentStatuses.PENDING
      },
      status: OrderStatuses.READY_TO_SHIP,
      assignedEmployee: orderManager._id,
      statusHistory: [
        { status: OrderStatuses.NEW, reason: 'Order placed by customer', timestamp: new Date(Date.now() - 1 * 86400000) },
        { status: OrderStatuses.CONFIRMED, changedBy: orderManager._id, reason: 'Confirmed with customer by phone', timestamp: new Date(Date.now() - 0.5 * 86400000) },
        { status: OrderStatuses.READY_TO_SHIP, changedBy: orderManager._id, reason: 'Awaiting courier pickup', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 1 * 86400000)
    });

    const order3 = await Order.create({
      orderNumber: 'MIRE-2026-00003',
      customerInfo: {
        fullName: 'Mariam Adel',
        phone: '+201200112233'
      },
      shippingAddress: {
        street: '15 El-Horreya St',
        city: 'Heliopolis',
        governorate: 'Cairo',
        country: 'Egypt'
      },
      items: [
        {
          product: product3._id,
          name: product3.name,
          sku: 'MIRE-TOP-003-IP-S',
          color: 'Ivory Pearl',
          size: 'S',
          quantity: 1,
          unitPrice: 990,
          subtotal: 990
        }
      ],
      pricing: {
        subtotal: 990,
        bundleDiscount: 0,
        couponDiscount: 0,
        shippingFee: 50,
        totalAmount: 1040
      },
      paymentInfo: {
        method: PaymentMethods.COD,
        status: PaymentStatuses.PENDING
      },
      status: OrderStatuses.NEW,
      statusHistory: [
        { status: OrderStatuses.NEW, reason: 'Order placed via WhatsApp Inbox', timestamp: new Date() }
      ],
      source: 'WHATSAPP'
    });

    // 8. Seed Returns & Inspection
    logger.info('Seeding return requests...');
    await Return.create({
      returnNumber: 'RET-2026-0001',
      originalOrder: order1._id,
      customer: customer1._id,
      items: [
        {
          product: product1._id,
          sku: 'MIRE-DRS-001-RQ-M',
          color: 'Rose Quartz',
          size: 'M',
          quantity: 1,
          unitPrice: 2150,
          condition: 'TAGS_ATTACHED',
          restockApproved: true,
          restockedAt: new Date()
        }
      ],
      reason: 'SIZE_TOO_LARGE',
      reasonDetails: 'Client requested smaller size (S instead of M)',
      status: ReturnStatuses.INSPECTED,
      refundAmount: 1950,
      refundMethod: 'ORIGINAL_PAYMENT',
      assignedEmployee: supportAgent._id,
      inspectedBy: inventoryManager._id,
      inspectedAt: new Date(),
      inspectionNotes: 'Dress inspected. Clean, tags intact, approved for restock.',
      statusHistory: [
        { status: ReturnStatuses.RETURN_REQUESTED, timestamp: new Date(Date.now() - 24 * 3600000) },
        { status: ReturnStatuses.RETURN_APPROVED, changedBy: supportAgent._id, timestamp: new Date(Date.now() - 20 * 3600000) },
        { status: ReturnStatuses.RECEIVED, changedBy: orderManager._id, timestamp: new Date(Date.now() - 6 * 3600000) },
        { status: ReturnStatuses.INSPECTED, changedBy: inventoryManager._id, timestamp: new Date() }
      ]
    });

    // 9. Seed Unified Social Inbox Channels & Conversations
    logger.info('Seeding social media accounts & conversations...');
    await SocialAccount.create({
      platform: 'WHATSAPP',
      accountName: 'MIRE Official WhatsApp VIP',
      identifier: env.META.WHATSAPP_PHONE_NUMBER_ID || '108827364812345',
      wabaId: env.META.WHATSAPP_BUSINESS_ACCOUNT_ID || 'waba_998877665544',
      accessToken: 'EAAG_dummy_token_for_seed',
      status: 'CONNECTED'
    });

    await SocialAccount.create({
      platform: 'INSTAGRAM',
      accountName: '@mire.couture',
      identifier: 'ig_mire_official_page_id_7788',
      accessToken: 'EAAG_dummy_token_for_seed',
      status: 'CONNECTED'
    });

    const conv1 = await Conversation.create({
      platform: 'WHATSAPP',
      externalUserId: '+201200112233',
      customerName: 'Mariam Adel',
      customerPhone: '+201200112233',
      status: ConversationStatuses.OPEN,
      assignedEmployee: supportAgent._id,
      unreadCount: 1,
      lastMessageText: 'Can I change my order delivery date to Thursday afternoon?',
      lastMessageAt: new Date(),
      linkedOrders: [order3._id]
    });

    await Message.create({
      conversation: conv1._id,
      platform: 'WHATSAPP',
      direction: 'INCOMING',
      senderId: '+201200112233',
      recipientId: 'BUSINESS_AGENT',
      content: 'Hello MIRE, I just placed an order for the Celeste blouse!',
      status: 'READ',
      createdAt: new Date(Date.now() - 3600000)
    });

    await Message.create({
      conversation: conv1._id,
      platform: 'WHATSAPP',
      direction: 'OUTGOING',
      senderId: 'BUSINESS_AGENT',
      recipientId: '+201200112233',
      content: 'Hello Mariam! Thank you for choosing MIRE. Your order #MIRE-2026-00003 is received. How can we assist you?',
      status: 'DELIVERED',
      sentBy: supportAgent._id,
      createdAt: new Date(Date.now() - 3000000)
    });

    await Message.create({
      conversation: conv1._id,
      platform: 'WHATSAPP',
      direction: 'INCOMING',
      senderId: '+201200112233',
      recipientId: 'BUSINESS_AGENT',
      content: 'Can I change my order delivery date to Thursday afternoon?',
      status: 'DELIVERED',
      createdAt: new Date()
    });

    const conv2 = await Conversation.create({
      platform: 'INSTAGRAM',
      externalUserId: 'ig_user_salma_designer',
      customerName: 'Salma Designer (@salma_d)',
      status: ConversationStatuses.OPEN,
      unreadCount: 2,
      lastMessageText: 'Is the Aurelia dress available in size S in Cairo boutique?',
      lastMessageAt: new Date(Date.now() - 15 * 60000)
    });

    await Message.create({
      conversation: conv2._id,
      platform: 'INSTAGRAM',
      direction: 'INCOMING',
      senderId: 'ig_user_salma_designer',
      recipientId: 'ig_mire_official_page_id_7788',
      content: 'Is the Aurelia dress available in size S in Cairo boutique?',
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 15 * 60000)
    });

    logger.info('========================================================');
    logger.info('✨ MIRE Database Seeded Successfully!');
    logger.info('========================================================');
    logger.info('Credentials for Testing:');
    logger.info('👑 Super Admin: superadmin@mirefashion.com / AdminPassword123!');
    logger.info('👩‍💼 Admin: admin@mirefashion.com / AdminPassword123!');
    logger.info('📦 Order Manager: orders@mirefashion.com / StaffPassword123!');
    logger.info('💬 Support: support@mirefashion.com / StaffPassword123!');
    logger.info('📊 Inventory: inventory@mirefashion.com / StaffPassword123!');
    logger.info('💰 Accountant: finance@mirefashion.com / StaffPassword123!');
    logger.info('🛍️ Customer: nour@example.com / CustomerPassword123!');
    logger.info('========================================================');

    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedData();
