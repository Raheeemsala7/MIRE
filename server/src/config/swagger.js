const swaggerJSDoc = require('swagger-jsdoc');
const env = require('./env');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MIRE Women Fashion E-commerce & Business Management API',
    version: '1.0.0',
    description: `Production-ready REST API for MIRE Luxury & Modest Women's Fashion Brand.
Features complete E-commerce storefront, Admin Business Management, Order Fulfillment, Real-Time Unified Social Inbox (WhatsApp, Instagram, Facebook), Returns Management, Dynamic Bundles Engine, Multi-Provider Payments (Stripe, Paymob, COD), and Inventory Movement Tracking.`,
    contact: {
      name: 'MIRE Architecture & Engineering',
      email: 'engineering@mirefashion.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token (Bearer <token>)'
      }
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Data retrieved successfully' },
          data: { type: 'array', items: { type: 'object' } },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 5 },
              hasNextPage: { type: 'boolean', example: true },
              hasPrevPage: { type: 'boolean', example: false }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Error description' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email format' }
              }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '673a5e8c1b2f3a001c9d4e5f' },
          name: { type: 'string', example: 'Layla El-Sayed' },
          email: { type: 'string', example: 'layla@mirefashion.com' },
          phone: { type: 'string', example: '+201012345678' },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'CUSTOMER_SUPPORT', 'INVENTORY_MANAGER', 'ACCOUNTANT', 'CUSTOMER'],
            example: 'ADMIN'
          },
          isActive: { type: 'boolean', example: true },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            example: ['orders:read', 'orders:write', 'products:manage']
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '673a5e8c1b2f3a001c9d4e60' },
          name: { type: 'string', example: 'Rose Satin Evening Maxi Dress' },
          slug: { type: 'string', example: 'rose-satin-evening-maxi-dress' },
          sku: { type: 'string', example: 'MIRE-DRS-001' },
          description: { type: 'string', example: 'Elegant double-lined satin maxi dress with bishop sleeves.' },
          price: { type: 'number', example: 1450 },
          discountPrice: { type: 'number', example: 1250 },
          category: { type: 'string', example: '673a5e8c1b2f3a001c9d4e50' },
          brand: { type: 'string', example: 'MIRE' },
          colors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Blush Pink' },
                code: { type: 'string', example: '#fbcfe8' }
              }
            }
          },
          sizes: {
            type: 'array',
            items: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
            example: ['S', 'M', 'L']
          },
          variants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                color: { type: 'string', example: 'Blush Pink' },
                size: { type: 'string', example: 'M' },
                sku: { type: 'string', example: 'MIRE-DRS-001-BP-M' },
                stockQuantity: { type: 'integer', example: 15 }
              }
            }
          },
          totalStock: { type: 'integer', example: 45 },
          isFeatured: { type: 'boolean', example: true },
          isNewArrival: { type: 'boolean', example: true },
          isBestSeller: { type: 'boolean', example: false },
          status: { type: 'string', enum: ['ACTIVE', 'DRAFT', 'ARCHIVED'], example: 'ACTIVE' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '673a5e8c1b2f3a001c9d4e70' },
          orderNumber: { type: 'string', example: 'MIRE-2026-1001' },
          customerInfo: {
            type: 'object',
            properties: {
              fullName: { type: 'string', example: 'Nouran Mostafa' },
              email: { type: 'string', example: 'nouran@example.com' },
              phone: { type: 'string', example: '+201123456789' }
            }
          },
          shippingAddress: {
            type: 'object',
            properties: {
              street: { type: 'string', example: '14 El-Thawra St' },
              city: { type: 'string', example: 'Heliopolis' },
              governorate: { type: 'string', example: 'Cairo' },
              country: { type: 'string', example: 'Egypt' }
            }
          },
          pricing: {
            type: 'object',
            properties: {
              subtotal: { type: 'number', example: 1250 },
              shippingFee: { type: 'number', example: 50 },
              discount: { type: 'number', example: 100 },
              totalAmount: { type: 'number', example: 1200 }
            }
          },
          paymentInfo: {
            type: 'object',
            properties: {
              method: { type: 'string', enum: ['COD', 'STRIPE', 'PAYMOB'], example: 'COD' },
              status: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'], example: 'PENDING' }
            }
          },
          status: {
            type: 'string',
            enum: ['NEW', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'CUSTOMER_NOT_RESPONDING', 'FAILED_DELIVERY'],
            example: 'NEW'
          }
        }
      }
    }
  },
  tags: [
    { name: 'Auth', description: 'Authentication, registration, JWT tokens & password recovery' },
    { name: 'Employees', description: 'Staff & Role-based Access Control management' },
    { name: 'Products', description: 'Product catalog, variant-level stock, searching & filtering' },
    { name: 'Categories', description: 'Hierarchical category management' },
    { name: 'Inventory', description: 'Inventory movement logs, alerts & manual stock adjustments' },
    { name: 'Bundles & Offers', description: 'Promotions, fixed price bundles, BOGO, discounts' },
    { name: 'Coupons', description: 'Coupon codes, limits & validations' },
    { name: 'Cart', description: 'Shopping cart, guest checkout & price recalculation' },
    { name: 'Orders', description: 'Order lifecycle, status workflows, assignment, CSV/Excel export' },
    { name: 'Returns', description: 'Return requests, inspection, customer contact attempts & inventory restock' },
    { name: 'Payments', description: 'Stripe, Egyptian Paymob & COD payment provider abstraction' },
    { name: 'Social Inbox', description: 'Unified Meta APIs for WhatsApp Cloud, Instagram & Messenger' },
    { name: 'Analytics', description: 'Sales, revenue, order statistics & business intelligence' },
    { name: 'Webhooks', description: 'Meta Graph API & Stripe secure webhook receivers' }
  ]
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/docs/*.js']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
