const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const ApiError = require('./utils/apiError');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const bundleRoutes = require('./routes/bundle.routes');
const couponRoutes = require('./routes/coupon.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const returnRoutes = require('./routes/return.routes');
const paymentRoutes = require('./routes/payment.routes');
const socialRoutes = require('./routes/social.routes');
const customerRoutes = require('./routes/customer.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const wishlistRoutes = require('./routes/wishlist.routes');

const app = express();

// 1. Security & Performance Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false // Allow Swagger UI and local development
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGIN.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id', 'stripe-signature']
  })
);

app.use(compression());

// 2. Body Parsing (Capture rawBody for Stripe Webhook Signature Verification)
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: '10mb'
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Data Sanitization against NoSQL injection
app.use(mongoSanitize());

// 4. Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Rate Limiting
app.use('/api/', apiLimiter);

// 6. Swagger API Documentation (Mandatory Requirement)
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MIRE E-Commerce API Documentation'
  })
);

// 7. Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});

// 8. API Routes Mounting
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to MIRE Women\'s Fashion E-Commerce & Business Management API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: `${env.API_PREFIX}/auth`,
      products: `${env.API_PREFIX}/products`,
      categories: `${env.API_PREFIX}/categories`,
      bundles: `${env.API_PREFIX}/bundles`,
      coupons: `${env.API_PREFIX}/coupons`,
      cart: `${env.API_PREFIX}/cart`,
      orders: `${env.API_PREFIX}/orders`,
      returns: `${env.API_PREFIX}/returns`,
      payments: `${env.API_PREFIX}/payments`,
      social: `${env.API_PREFIX}/social`,
      analytics: `${env.API_PREFIX}/analytics/dashboard`,
      customers: `${env.API_PREFIX}/customers`,
      employees: `${env.API_PREFIX}/employees`,
      notifications: `${env.API_PREFIX}/notifications`,
      wishlist: `${env.API_PREFIX}/wishlist`
    }
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/bundles', bundleRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/returns', returnRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/social', socialRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/wishlist', wishlistRoutes);

app.use(env.API_PREFIX, apiRouter);

// 9. 404 Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`));
});

// 10. Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
