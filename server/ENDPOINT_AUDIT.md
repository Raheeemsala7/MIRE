# Backend Endpoint Inventory

### GET /wishlist
- **Summary**: Retrieve user's paginated wishlist items
- **Tag**: Wishlist
- **Auth**: [{"BearerAuth":[]}]
- **Params**: page (query), limit (query)

### POST /wishlist
- **Summary**: Add product to wishlist
- **Tag**: Wishlist
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### DELETE /wishlist
- **Summary**: Clear all items in user's wishlist
- **Tag**: Wishlist
- **Auth**: [{"BearerAuth":[]}]

### GET /wishlist/check/{productId}
- **Summary**: Check if a product is in current user's wishlist
- **Tag**: Wishlist
- **Auth**: [{"BearerAuth":[]}]
- **Params**: productId (path, required)

### DELETE /wishlist/items/{productId}
- **Summary**: Remove product from wishlist
- **Tag**: Wishlist
- **Auth**: [{"BearerAuth":[]}]
- **Params**: productId (path, required)

### GET /social/webhook/meta
- **Summary**: Meta Webhook Challenge Verification (WhatsApp, IG, Messenger)
- **Tag**: Webhooks
- **Auth**: Public

### POST /social/webhook/meta
- **Summary**: Ingest Meta Messaging Events (WhatsApp Cloud API, Instagram, Messenger)
- **Tag**: Webhooks
- **Auth**: Public

### GET /social/conversations
- **Summary**: List unified social inbox conversations
- **Tag**: Social Inbox
- **Auth**: [{"BearerAuth":[]}]

### GET /social/conversations/{id}/messages
- **Summary**: Get conversation message thread
- **Tag**: Social Inbox
- **Auth**: [{"BearerAuth":[]}]

### POST /social/conversations/{id}/reply
- **Summary**: Send agent reply to customer on WhatsApp, IG, or Messenger
- **Tag**: Social Inbox
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### PATCH /social/conversations/{id}
- **Summary**: Update conversation status, assignee, or tags
- **Tag**: Social Inbox
- **Auth**: [{"BearerAuth":[]}]

### POST /social/conversations/{id}/convert-to-order
- **Summary**: Convert social conversation into an active order
- **Tag**: Social Inbox
- **Auth**: [{"BearerAuth":[]}]

### POST /social/conversations/{id}/link-customer
- **Summary**: Link social conversation to existing customer profile
- **Tag**: Social Inbox
- **Auth**: [{"BearerAuth":[]}]

### GET /social/accounts
- **Summary**: Get connected social accounts configuration status
- **Tag**: Social Inbox
- **Auth**: [{"BearerAuth":[]}]

### POST /social/accounts
- **Summary**: Connect a new social channel account
- **Tag**: Social Inbox
- **Auth**: [{"BearerAuth":[]}]

### POST /returns/request
- **Summary**: Submit a return request for a delivered order
- **Tag**: Returns
- **Auth**: Public
- **Request Body**: Yes

### GET /returns
- **Summary**: List return requests with filter by status
- **Tag**: Returns
- **Auth**: [{"BearerAuth":[]}]

### GET /returns/{id}
- **Summary**: Get single return details
- **Tag**: Returns
- **Auth**: [{"BearerAuth":[]}]

### PATCH /returns/{id}/status
- **Summary**: Update return status
- **Tag**: Returns
- **Auth**: [{"BearerAuth":[]}]

### POST /returns/{id}/inspect
- **Summary**: Inspect returned items and conditionally restock inventory
- **Tag**: Returns
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### POST /returns/{id}/call-attempt
- **Summary**: Log customer follow-up call attempt
- **Tag**: Returns
- **Auth**: [{"BearerAuth":[]}]

### PATCH /returns/{id}/assign
- **Summary**: Assign return handling to employee
- **Tag**: Returns
- **Auth**: [{"BearerAuth":[]}]

### GET /products
- **Summary**: Get all products with filters and search
- **Tag**: Products
- **Auth**: Public
- **Params**: search (query), category (query), minPrice (query), maxPrice (query), isFeatured (query), isNewArrival (query), page (query), limit (query)

### POST /products
- **Summary**: Create new product with variants
- **Tag**: Products
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### GET /products/slug/{slug}
- **Summary**: Get product by slug
- **Tag**: Products
- **Auth**: Public
- **Params**: slug (path, required)

### GET /products/{id}/related
- **Summary**: Get related products in same category
- **Tag**: Products
- **Auth**: Public
- **Params**: id (path, required)

### GET /products/{id}
- **Summary**: Get product by ID
- **Tag**: Products
- **Auth**: Public
- **Params**: id (path, required)

### PATCH /products/{id}
- **Summary**: Update product details
- **Tag**: Products
- **Auth**: [{"BearerAuth":[]}]
- **Params**: id (path, required)

### DELETE /products/{id}
- **Summary**: Archive product
- **Tag**: Products
- **Auth**: [{"BearerAuth":[]}]
- **Params**: id (path, required)

### POST /payments/session
- **Summary**: Create payment session (Stripe, Paymob, COD)
- **Tag**: Payments
- **Auth**: Public
- **Request Body**: Yes

### GET /payments/transactions
- **Summary**: List all payment transactions (Accountant / Admin)
- **Tag**: Payments
- **Auth**: [{"BearerAuth":[]}]

### POST /payments/refund
- **Summary**: Issue payment refund
- **Tag**: Payments
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### POST /payments/webhook/stripe
- **Summary**: Stripe Webhook Endpoint (HMAC signature verified)
- **Tag**: Webhooks
- **Auth**: Public

### POST /payments/webhook/paymob
- **Summary**: Paymob Transaction Callback Webhook (HMAC verified)
- **Tag**: Webhooks
- **Auth**: Public

### POST /orders/checkout
- **Summary**: Place order from cart (Customer or Guest)
- **Tag**: Orders
- **Auth**: Public
- **Request Body**: Yes

### GET /orders/export/csv
- **Summary**: Export orders to CSV
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### GET /orders/export/excel
- **Summary**: Export orders to Excel
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### GET /orders
- **Summary**: List orders with filters (Admin/Staff) or Own Orders (Customer)
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### POST /orders/manual
- **Summary**: Create manual order (from Social Inbox or phone)
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### PATCH /orders/bulk-status
- **Summary**: Bulk update order statuses
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### GET /orders/{id}
- **Summary**: Get single order details
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### PATCH /orders/{id}/status
- **Summary**: Update order status
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### PATCH /orders/{id}/assign
- **Summary**: Assign order to employee
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### POST /orders/{id}/notes
- **Summary**: Add internal staff note to order
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### POST /orders/{id}/delivery-attempt
- **Summary**: Log delivery or customer call attempt
- **Tag**: Orders
- **Auth**: [{"BearerAuth":[]}]

### POST /inventory/adjust
- **Summary**: Manually adjust stock for a variant with audit trail
- **Tag**: Inventory
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### GET /inventory/movements
- **Summary**: List paginated stock movement audit trail
- **Tag**: Inventory
- **Auth**: [{"BearerAuth":[]}]

### GET /inventory/low-stock
- **Summary**: Get low stock alerts for inventory replenishment
- **Tag**: Inventory
- **Auth**: [{"BearerAuth":[]}]

### GET /employees
- **Summary**: List all staff members
- **Tag**: Employees
- **Auth**: [{"BearerAuth":[]}]
- **Params**: role (query), search (query)

### POST /employees
- **Summary**: Create new employee account
- **Tag**: Employees
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### GET /employees/{id}
- **Summary**: Get single employee
- **Tag**: Employees
- **Auth**: [{"BearerAuth":[]}]
- **Params**: id (path, required)

### PATCH /employees/{id}
- **Summary**: Update employee role and permissions
- **Tag**: Employees
- **Auth**: [{"BearerAuth":[]}]
- **Params**: id (path, required)

### PATCH /employees/{id}/toggle-status
- **Summary**: Activate/deactivate employee
- **Tag**: Employees
- **Auth**: [{"BearerAuth":[]}]
- **Params**: id (path, required)

### GET /customers
- **Summary**: List all customers with search and filters
- **Tag**: Customers
- **Auth**: [{"BearerAuth":[]}]

### GET /customers/{id}
- **Summary**: Get customer details and recent order history
- **Tag**: Customers
- **Auth**: [{"BearerAuth":[]}]

### PATCH /customers/{id}
- **Summary**: Update customer tags, notes, or profile details
- **Tag**: Customers
- **Auth**: [{"BearerAuth":[]}]

### POST /coupons/validate
- **Summary**: Validate a coupon code against current subtotal
- **Tag**: Coupons
- **Auth**: Public
- **Request Body**: Yes

### GET /coupons
- **Summary**: List all coupons (Admin)
- **Tag**: Coupons
- **Auth**: [{"BearerAuth":[]}]

### POST /coupons
- **Summary**: Create new discount coupon
- **Tag**: Coupons
- **Auth**: [{"BearerAuth":[]}]

### PATCH /coupons/{id}
- **Summary**: Update coupon details
- **Tag**: Coupons
- **Auth**: [{"BearerAuth":[]}]

### DELETE /coupons/{id}
- **Summary**: Delete coupon
- **Tag**: Coupons
- **Auth**: [{"BearerAuth":[]}]

### GET /categories
- **Summary**: List all categories (storefront & admin)
- **Tag**: Categories
- **Auth**: Public
- **Params**: includeInactive (query)

### POST /categories
- **Summary**: Create category
- **Tag**: Categories
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### GET /categories/{slug}
- **Summary**: Get category by slug
- **Tag**: Categories
- **Auth**: Public
- **Params**: slug (path, required)

### PATCH /categories/{id}
- **Summary**: Update category
- **Tag**: Categories
- **Auth**: [{"BearerAuth":[]}]
- **Params**: id (path, required)

### DELETE /categories/{id}
- **Summary**: Delete category
- **Tag**: Categories
- **Auth**: [{"BearerAuth":[]}]
- **Params**: id (path, required)

### GET /cart
- **Summary**: Retrieve current cart for customer or guest
- **Tag**: Cart
- **Auth**: Public
- **Params**: x-guest-id (header)

### POST /cart
- **Summary**: Add item to cart (root alias)
- **Tag**: Cart
- **Auth**: Public
- **Request Body**: Yes

### POST /cart/items
- **Summary**: Add item to cart with variant validation
- **Tag**: Cart
- **Auth**: Public
- **Request Body**: Yes

### PATCH /cart/items/{itemId}
- **Summary**: Update cart item quantity
- **Tag**: Cart
- **Auth**: Public
- **Params**: itemId (path, required)
- **Request Body**: Yes

### DELETE /cart/items/{itemId}
- **Summary**: Remove item from cart
- **Tag**: Cart
- **Auth**: Public
- **Params**: itemId (path, required)

### POST /cart/bundle
- **Summary**: Apply bundle offer to cart
- **Tag**: Cart
- **Auth**: Public

### POST /cart/coupon
- **Summary**: Apply coupon code to cart
- **Tag**: Cart
- **Auth**: Public

### DELETE /cart/coupon
- **Summary**: Remove applied coupon
- **Tag**: Cart
- **Auth**: Public

### POST /cart/governorate
- **Summary**: Set delivery governorate to calculate shipping fee
- **Tag**: Cart
- **Auth**: Public

### DELETE /cart/clear
- **Summary**: Clear all items in cart
- **Tag**: Cart
- **Auth**: Public

### GET /bundles
- **Summary**: List all bundles & promotions
- **Tag**: Bundles & Offers
- **Auth**: Public
- **Params**: activeOnly (query)

### POST /bundles
- **Summary**: Create new promotional bundle
- **Tag**: Bundles & Offers
- **Auth**: [{"BearerAuth":[]}]

### GET /bundles/{id}
- **Summary**: Get bundle details with eligible products
- **Tag**: Bundles & Offers
- **Auth**: Public
- **Params**: id (path, required)

### PATCH /bundles/{id}
- **Summary**: Update bundle details
- **Tag**: Bundles & Offers
- **Auth**: [{"BearerAuth":[]}]

### DELETE /bundles/{id}
- **Summary**: Delete bundle
- **Tag**: Bundles & Offers
- **Auth**: [{"BearerAuth":[]}]

### POST /auth/register
- **Summary**: Register a new customer
- **Tag**: Auth
- **Auth**: Public
- **Request Body**: Yes

### POST /auth/login
- **Summary**: Login for customer, admin, or staff
- **Tag**: Auth
- **Auth**: Public
- **Request Body**: Yes

### POST /auth/refresh-token
- **Summary**: Refresh JWT access token
- **Tag**: Auth
- **Auth**: Public
- **Request Body**: Yes

### POST /auth/logout
- **Summary**: Logout user and invalidate refresh token
- **Tag**: Auth
- **Auth**: [{"BearerAuth":[]}]

### POST /auth/forgot-password
- **Summary**: Initiate password reset
- **Tag**: Auth
- **Auth**: Public
- **Request Body**: Yes

### POST /auth/reset-password
- **Summary**: Reset password using verification token
- **Tag**: Auth
- **Auth**: Public
- **Request Body**: Yes

### GET /auth/me
- **Summary**: Get currently authenticated user profile
- **Tag**: Auth
- **Auth**: [{"BearerAuth":[]}]

### PATCH /auth/me
- **Summary**: Update profile details
- **Tag**: Auth
- **Auth**: [{"BearerAuth":[]}]
- **Request Body**: Yes

### GET /analytics/dashboard
- **Summary**: Get comprehensive analytics metrics, KPIs, and chart series for admin dashboard
- **Tag**: Analytics
- **Auth**: [{"BearerAuth":[]}]
- **Params**: range (query), startDate (query), endDate (query)

