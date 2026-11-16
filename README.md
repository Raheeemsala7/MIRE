# MIRE Luxury Women Fashion — E-commerce & Business Management Platform

A production-ready, enterprise-grade E-commerce and Business Management OS engineered for luxury and modest women's apparel brands. Built with modular clean architecture, robust security practices, a promotions engine, inventory protection against overselling, automated return inspections, payment provider abstraction, and a unified Meta social inbox (WhatsApp Cloud, Instagram Direct, Facebook Messenger).

---

## 🌟 Platform Highlights

- **Bilingual & Multi-Channel Experience:** English (LTR) and Arabic (RTL) across customer storefront and administrative command center.
- **Unified Social Media Inbox:** Consolidated real-time dashboard for WhatsApp Cloud API, Instagram Messaging API, and Facebook Messenger Platform via official Meta Graph webhooks with one-click **"Convert Conversation to Order"**.
- **Promotions & Bundles Engine:** Flexible pricing engine supporting Fixed Price bundles (e.g. 2 for 599 EGP), Buy X Get Y (BOGO), percentage discounts, minimum spend rules, and stacking conflict prevention.
- **Inventory & Warehouse Telemetry:** Transaction-safe atomic stock decrement, overselling prevention, variant-level stock tracking (Color & Size: XS to XXL), low-stock Socket.IO push alerts, and audit trail of all movements.
- **Reverse Logistics & Returns Management:** Structured return lifecycle (`REQUESTED` → `APPROVED` → `PICKUP` → `RECEIVED` → `INSPECTED` → `REFUNDED`), customer call attempt tracker (1st, 2nd, 3rd calls), and **safe inventory restock only after physical inspection approval**.
- **Payment Provider Abstraction Layer:** Interchangeable payment processing supporting Cash on Delivery (COD), Stripe Checkout with cryptographic webhook signature verification, and Egyptian Paymob Gateway with HMAC SHA-512 validation.
- **Comprehensive Admin Business Dashboard:** 10 core overview KPI cards, dynamic Recharts visualizations (revenue over time, order status breakdown, sales by category, best-selling gowns, payment methods), staff RBAC permissions, and printable commercial invoices.
- **Interactive Swagger / OpenAPI 3.0 Documentation:** Interactive testable API documentation exposed at `/api-docs`.

---

## 🏛️ System Architecture

```
mire-e-commerce/
├── server/                       # Production Express.js + MongoDB API
│   ├── src/
│   │   ├── config/               # DB, Env, Swagger, Socket.IO, Stripe, Cloudinary
│   │   ├── models/               # 19 Mongoose Schemas with indexes & hooks
│   │   ├── controllers/          # HTTP request handlers
│   │   ├── services/             # Pure business logic layer
│   │   ├── routes/               # Express REST route definitions with Swagger annotations
│   │   ├── middlewares/          # Auth, RBAC, Zod Validator, Rate Limiter, Error Handler
│   │   ├── validators/           # Zod schema definitions
│   │   ├── integrations/
│   │   │   ├── whatsapp/         # Meta WhatsApp Business Cloud API
│   │   │   ├── instagram/        # Meta Instagram Graph API
│   │   │   └── facebook/         # Meta Messenger Graph API
│   │   │   └── payments/         # Payment Provider Interface (Stripe, Paymob, COD)
│   │   ├── webhooks/             # Stripe HMAC & Meta Graph webhook receivers
│   │   ├── seed/                 # Database seed script with demo catalog & staff
│   │   ├── utils/                # Logger, ApiResponse, ApiError, AuditLogger, Pagination
│   │   ├── app.js                # Express app setup & middleware pipeline
│   │   └── server.js             # HTTP & Socket.IO server entrypoint
│   └── tests/                    # Automated integration & unit test suite (Jest + Supertest)
│
├── admin/                        # React + Vite + TypeScript Business Management Dashboard
│   ├── src/
│   │   ├── layouts/              # Admin layout with responsive sidebar, notifications & RTL
│   │   ├── pages/                # Overview, Orders, Products, Categories, Bundles,
│   │   │                         # Customers, Returns, Social Inbox, Payments, Inventory,
│   │   │                         # Employees, Reports, Settings, Login
│   │   ├── context/              # AuthContext (JWT) & LanguageContext (EN/AR)
│   │   ├── hooks/                # useSocket for real-time order & message alerts
│   │   └── services/             # Axios API client with token refresh interceptors
│
└── client/                       # Customer Storefront (Next.js 16 + Tailwind CSS)
    └── src/                      # Catalog, Lookbook, Product view, Cart & Checkout
```

---

## 🔑 Demo & Test Credentials

After running the database seed script (`npm run seed` in `server/`), use these accounts:

| Role | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@mirefashion.com` | `AdminPassword123!` | Full Access (`*`) |
| **Admin** | `admin@mirefashion.com` | `AdminPassword123!` | Operations, Catalog, Orders, Staff |
| **Order Manager** | `orders@mirefashion.com` | `StaffPassword123!` | Order fulfillment, Returns, Invoices |
| **Customer Support** | `support@mirefashion.com` | `StaffPassword123!` | Social Inbox (WhatsApp/IG), Orders view |
| **Inventory Manager** | `inventory@mirefashion.com` | `StaffPassword123!` | Stock adjustments, Product variants, Restock |
| **Accountant** | `finance@mirefashion.com` | `StaffPassword123!` | Payments, Transactions, Financial Reports |
| **Customer** | `nour@example.com` | `CustomerPassword123!` | Storefront checkout, order history |

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI
- **pnpm / npm**

### 2. Backend Server Setup (`server/`)
```bash
cd server

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env (pre-configured with working defaults)
cp .env.example .env

# Seed initial database (staff, categories, garments, variants, bundles, orders, chats)
npm run seed

# Run automated tests
npm test

# Start backend server in development mode
npm run dev
# Server runs on http://localhost:5000
# Swagger API docs accessible at http://localhost:5000/api-docs
```

### 3. Admin Management Dashboard Setup (`admin/`)
```bash
cd admin

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Access Admin Portal at http://localhost:5173
```

### 4. Customer Storefront Setup (`client/`)
```bash
cd client

# Install dependencies
pnpm install

# Start Next.js storefront
pnpm dev
# Storefront runs on http://localhost:3000
```

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Permission | Super Admin | Admin | Order Manager | Customer Support | Inventory Manager | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `dashboard:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `orders:read` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `orders:write` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `orders:export` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `products:manage` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `inventory:write` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `returns:manage` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `social:manage` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `payments:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `employees:manage`| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 💳 Payment Provider Integration

The payment abstraction layer (`server/src/integrations/payments/`) decouples checkout logic from specific payment gateways:

1. **Stripe Checkout:**
   - Prepares line items in EGP.
   - Creates secure Checkout Session.
   - Verifies incoming webhook signatures using `stripe.webhooks.constructEvent`.
   - Never trusts payment confirmation from client-side callbacks.

2. **Paymob (Egypt Gateway):**
   - Three-step authentication: Auth token → Order registration → Payment key generation.
   - Egyptian card and mobile wallet iframe integration.
   - HMAC SHA-512 webhook signature verification.

3. **Cash on Delivery (COD):**
   - Immediate order confirmation with pending payment status.
   - Payment status shifts to `PAID` automatically upon courier delivery confirmation.

---

## 📱 Unified Social Media Inbox Architecture

Official Meta Graph API v20.0 integration handling WhatsApp Business Cloud, Instagram Direct, and Messenger:

- **Webhook Verification:** GET handler verifies `hub.mode === 'subscribe'` and `hub.verify_token === META_VERIFY_TOKEN`.
- **Event Ingestion:** POST handler normalizes incoming messages from all channels into a unified schema:
  ```json
  {
    "conversationId": "673a5...",
    "platform": "WHATSAPP",
    "direction": "INCOMING",
    "senderId": "+201200112233",
    "content": "Can I change delivery to Thursday?",
    "messageType": "TEXT"
  }
  ```
- **Real-Time Dispatch:** Incoming messages immediately broadcast to customer support agents over Socket.IO (`social:message_received`).
- **Convert to Order:** Support agents can convert an active chat into an order with 1 click, automatically associating customer info and linking the order to the chat thread.

---

## 📦 API Testing Examples (cURL)

### 1. Authenticate Staff Member
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mirefashion.com","password":"AdminPassword123!"}'
```

### 2. Add Item to Cart
```bash
curl -X POST http://localhost:5000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -H "x-guest-id: guest_12345" \
  -d '{"productId":"<PRODUCT_ID>","variantSku":"MIRE-DRS-001-RQ-M","quantity":1}'
```

### 3. Place Order from Cart
```bash
curl -X POST http://localhost:5000/api/v1/orders/checkout \
  -H "Content-Type: application/json" \
  -H "x-guest-id: guest_12345" \
  -d '{
    "customerInfo": {
      "fullName": "Salma Tarek",
      "phone": "+201012345678",
      "email": "salma@example.com"
    },
    "shippingAddress": {
      "street": "15 Nile St",
      "city": "Zamalek",
      "governorate": "Cairo"
    },
    "paymentMethod": "COD"
  }'
```

### 4. Query Dashboard Metrics
```bash
curl -X GET "http://localhost:5000/api/v1/analytics/dashboard?range=30d" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 🧪 Testing Suite

Execute the automated test suite covering authentication, RBAC, atomic inventory decrement, overselling prevention, promotions calculation, orders lifecycle, and returns inspection:

```bash
cd server
npm test
```

Results:
```
PASS tests/returns.test.js
PASS tests/orders.test.js
PASS tests/auth.test.js
PASS tests/inventory.test.js
PASS tests/promotions.test.js

Test Suites: 5 passed, 5 total
Tests:       14 passed, 14 total
```

---

## 🚢 Production Deployment

### Docker Deployment
A `docker-compose.yml` can orchestrate the application:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    restart: always
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./server
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/mire_ecommerce
    depends_on:
      - mongodb

  admin:
    build: ./admin
    restart: always
    ports:
      - "5173:80"

volumes:
  mongo_data:
```

### PM2 Process Management
```bash
cd server
npm install -g pm2
pm2 start src/server.js --name "mire-backend" -i max
pm2 save
pm2 startup
```

---

© 2026 MIRE Luxury Women Fashion Brand. All rights reserved.
