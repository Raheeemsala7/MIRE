const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');

async function runLiveSystemTest() {
  console.log('====================================================');
  console.log('🚀 Starting Comprehensive Live System Health & API Test');
  console.log('====================================================');

  const testPort = 5005;
  const baseUrl = `http://127.0.0.1:${testPort}`;
  const server = http.createServer(app);
  initSocket(server, '*');

  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  function recordResult(name, success, details) {
    if (success) {
      passedTests++;
      console.log(`✅ [PASS] ${name} - ${details}`);
      results.push({ name, status: 'PASS', details });
    } else {
      failedTests++;
      console.error(`❌ [FAIL] ${name} - ${details}`);
      results.push({ name, status: 'FAIL', details });
    }
  }

  try {
    console.log('\n[1/3] Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('Connected to Atlas successfully!');

    await new Promise((resolve) => server.listen(testPort, resolve));
    console.log(`Test server running at ${baseUrl}`);

    console.log('\n[2/3] Executing API verification tests...');

    // Test 1: Health check
    try {
      const res = await fetch(`${baseUrl}/health`);
      const data = await res.json();
      recordResult(
        'Health Endpoint (/health)',
        res.status === 200 && data.status === 'UP',
        `Status: ${res.status}, Uptime: ${data.uptime?.toFixed(1)}s`
      );
    } catch (e) {
      recordResult('Health Endpoint (/health)', false, e.message);
    }

    // Test 2: Swagger Documentation
    try {
      const res = await fetch(`${baseUrl}/api-docs/`);
      const text = await res.text();
      recordResult(
        'Swagger UI Documentation (/api-docs)',
        res.status === 200 && (text.includes('swagger') || text.includes('MIRE') || text.includes('html')),
        `Status: ${res.status}, Page size: ${text.length} bytes`
      );
    } catch (e) {
      recordResult('Swagger UI Documentation (/api-docs)', false, e.message);
    }

    // Test 3: Super Admin Login
    let adminToken = '';
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'superadmin@mirefashion.com',
          password: 'AdminPassword123!'
        })
      });
      const json = await res.json();
      adminToken = json.data?.accessToken;
      recordResult(
        'Super Admin Authentication (POST /api/v1/auth/login)',
        res.status === 200 && !!adminToken,
        `Status: ${res.status}, Token: Received, User: ${json.data?.user?.name} (${json.data?.user?.role})`
      );
    } catch (e) {
      recordResult('Super Admin Authentication', false, e.message);
    }

    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // Test 4: Current User Profile (Auth Protected)
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: authHeaders });
      const json = await res.json();
      const user = json.data?.user;
      recordResult(
        'Protected Profile Verification (GET /api/v1/auth/me)',
        res.status === 200 && user?.email === 'superadmin@mirefashion.com',
        `User: ${user?.name}, Email: ${user?.email}, Role: ${user?.role}`
      );
    } catch (e) {
      recordResult('Protected Profile Verification', false, e.message);
    }

    // Test 5: Products Catalog
    let testProductId = '';
    let testVariantSku = '';
    try {
      const res = await fetch(`${baseUrl}/api/v1/products?limit=5`);
      const json = await res.json();
      const products = Array.isArray(json.data) ? json.data : [];
      if (products.length > 0) {
        testProductId = products[0]._id;
        testVariantSku = products[0].variants?.[0]?.sku || products[0].sku;
      }
      recordResult(
        'Products Catalog (GET /api/v1/products)',
        res.status === 200 && products.length > 0,
        `Found ${products.length} products (Total in DB: ${json.meta?.total || products.length}). Sample: "${products[0]?.name}" - ${products[0]?.price} EGP`
      );
    } catch (e) {
      recordResult('Products Catalog', false, e.message);
    }

    // Test 6: Categories
    try {
      const res = await fetch(`${baseUrl}/api/v1/categories`);
      const json = await res.json();
      const categories = Array.isArray(json.data) ? json.data : [];
      recordResult(
        'Categories List (GET /api/v1/categories)',
        res.status === 200 && categories.length > 0,
        `Found ${categories.length} categories: [${categories.map(c => c.name).join(', ')}]`
      );
    } catch (e) {
      recordResult('Categories List', false, e.message);
    }

    // Test 7: Promotional Bundles & Offers
    try {
      const res = await fetch(`${baseUrl}/api/v1/bundles`);
      const json = await res.json();
      const bundles = Array.isArray(json.data) ? json.data : [];
      recordResult(
        'Promotions & Bundles (GET /api/v1/bundles)',
        res.status === 200 && bundles.length > 0,
        `Found ${bundles.length} active bundles. Sample: "${bundles[0]?.title}" (${bundles[0]?.discountPercentage || 0}% off for ${bundles[0]?.requiredQuantity} items)`
      );
    } catch (e) {
      recordResult('Promotions & Bundles', false, e.message);
    }

    // Test 8: Order Management System (Admin Protected)
    try {
      const res = await fetch(`${baseUrl}/api/v1/orders?limit=5`, { headers: authHeaders });
      const json = await res.json();
      const orders = Array.isArray(json.data) ? json.data : [];
      recordResult(
        'Order Management System (GET /api/v1/orders)',
        res.status === 200 && orders.length > 0,
        `Found ${orders.length} orders (Total: ${json.meta?.total}). Sample: #${orders[0]?.orderNumber} [${orders[0]?.orderStatus}] - Total: ${orders[0]?.totalAmount} EGP`
      );
    } catch (e) {
      recordResult('Order Management System', false, e.message);
    }

    // Test 9: Returns & Reverse Logistics (Admin Protected)
    try {
      const res = await fetch(`${baseUrl}/api/v1/returns?limit=5`, { headers: authHeaders });
      const json = await res.json();
      const returns = Array.isArray(json.data) ? json.data : [];
      recordResult(
        'Returns Management Module (GET /api/v1/returns)',
        res.status === 200 && Array.isArray(returns),
        `Found ${returns.length} return requests. Sample: Reason "${returns[0]?.reason || 'N/A'}" [Status: ${returns[0]?.status || 'EMPTY'}]`
      );
    } catch (e) {
      recordResult('Returns Management Module', false, e.message);
    }

    // Test 10: Unified Social Media Inbox (Admin Protected)
    try {
      const res = await fetch(`${baseUrl}/api/v1/social/conversations`, { headers: authHeaders });
      const json = await res.json();
      const conversations = Array.isArray(json.data) ? json.data : [];
      recordResult(
        'Unified Social Media Inbox (GET /api/v1/social/conversations)',
        res.status === 200 && conversations.length > 0,
        `Found ${conversations.length} conversations. Channels: [${conversations.map(c => c.channel).join(', ')}]`
      );
    } catch (e) {
      recordResult('Unified Social Media Inbox', false, e.message);
    }

    // Test 11: Business Analytics Dashboard (Admin Protected)
    try {
      const res = await fetch(`${baseUrl}/api/v1/analytics/dashboard?range=30d`, { headers: authHeaders });
      const json = await res.json();
      const overview = json.data?.overview;
      recordResult(
        'Business Analytics Dashboard (GET /api/v1/analytics/dashboard)',
        res.status === 200 && !!overview,
        `Total Revenue: ${overview?.totalRevenue?.toLocaleString()} EGP, Total Orders: ${overview?.totalOrders}, Total Customers: ${overview?.totalCustomers}, Avg Order Value: ${overview?.averageOrderValue?.toFixed(0)} EGP`
      );
    } catch (e) {
      recordResult('Business Analytics Dashboard', false, e.message);
    }

    // Test 12: Customer Cart, Pricing Engine & Coupon Discount Flow
    try {
      const customerEmail = `customer.test.${Date.now()}@example.com`;
      const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Customer',
          email: customerEmail,
          password: 'CustomerPassword123!',
          phone: '+201099887766'
        })
      });
      const regJson = await regRes.json();
      const custToken = regJson.data?.accessToken;

      const custHeaders = {
        'Authorization': `Bearer ${custToken}`,
        'Content-Type': 'application/json'
      };

      // Add item to cart with quantity 2 (ensures subtotal > 1000 EGP for WELCOME10 coupon)
      const cartRes = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: custHeaders,
        body: JSON.stringify({
          productId: testProductId,
          variantSku: testVariantSku,
          quantity: 2
        })
      });
      const cartJson = await cartRes.json();
      const cartItems = cartJson.data?.items || [];

      // Apply coupon code
      const couponRes = await fetch(`${baseUrl}/api/v1/cart/coupon`, {
        method: 'POST',
        headers: custHeaders,
        body: JSON.stringify({ couponCode: 'WELCOME10' })
      });
      const couponJson = await couponRes.json();

      recordResult(
        'Customer Cart, Pricing & Coupon Discount Engine',
        cartRes.status === 200 && cartItems.length > 0 && couponRes.status === 200,
        `Items in cart: ${cartItems.length}, Subtotal: ${couponJson.data?.subtotal} EGP, Discount: -${couponJson.data?.couponDiscount} EGP, Total: ${couponJson.data?.finalTotal} EGP`
      );
    } catch (e) {
      recordResult('Customer Cart, Pricing & Coupon Discount Engine', false, e.message);
    }

  } catch (err) {
    console.error('Fatal test runner error:', err);
  } finally {
    console.log('\n[3/3] Shutting down test server and closing DB connection...');
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  }

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests} tests`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLiveSystemTest();
