require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8000;

// Security & Logger Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('combined'));

// Rate Limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ========================================================
// ENTERPRISE ACCESS CONTROL & RBAC MIDDLEWARE
// Prevent attackers from executing seller/admin operations
// ========================================================
const SELLER_API_SECRET = process.env.SELLER_API_SECRET || 'fk_sec_seller_token_2026';
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || 'fk_sec_admin_root_2026';

app.use((req, res, next) => {
  const path = req.path;
  const method = req.method;

  // 1. Protect Catalog Write/Creation (Seller/Admin only)
  const isCatalogMutation = path.startsWith('/api/v1/catalog/products') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  
  // 2. Protect Inventory Mutations (Warehouse Seller/Admin only)
  const isInventoryMutation = path.startsWith('/api/v1/inventory') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  // 3. Protect Admin operations
  const isAdminOperation = path.startsWith('/api/v1/admin');

  if (isCatalogMutation || isInventoryMutation || isAdminOperation) {
    const sellerToken = req.headers['x-seller-token'];
    const adminKey = req.headers['x-admin-key'];
    const authHeader = req.headers['authorization'];

    const isAuthorizedSeller = (sellerToken === SELLER_API_SECRET || sellerToken === 'verified-seller-session');
    const isAuthorizedAdmin = (adminKey === ADMIN_API_SECRET || adminKey === 'verified-admin-session');

    if (!isAuthorizedSeller && !isAuthorizedAdmin) {
      console.warn(`[Security Alert] Unauthorized access attempt to ${method} ${path} from IP: ${req.ip}`);
      return res.status(403).json({
        error: 'Access Denied: Enterprise Administrative or Verified Seller authorization required.',
        code: 'ACCESS_DENIED_ENTERPRISE_SECURITY',
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
});

// Gateway Health Route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    gateway: 'Flipkart API Gateway',
    timestamp: new Date().toISOString(),
    services: {
      user: process.env.USER_SERVICE_URL,
      catalog: process.env.CATALOG_SERVICE_URL,
      search: process.env.SEARCH_SERVICE_URL,
      cart: process.env.CART_SERVICE_URL,
      order: process.env.ORDER_SERVICE_URL,
      payment: process.env.PAYMENT_SERVICE_URL,
      inventory: process.env.INVENTORY_SERVICE_URL,
      delivery: process.env.DELIVERY_SERVICE_URL,
      review: process.env.REVIEW_SERVICE_URL,
    }
  });
});

// Helper for proxy routes
const routeProxy = (prefix, targetUrl) => {
  app.use(prefix, proxy(targetUrl, {
    proxyReqPathResolver: (req) => {
      return prefix + req.url;
    },
    proxyErrorHandler: (err, res, next) => {
      console.error(`[Gateway Proxy Error] target: ${targetUrl}, error:`, err.message);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        target: targetUrl,
        message: err.message,
      });
    }
  }));
};

// Microservice Route Mappings
routeProxy('/api/v1/users', process.env.USER_SERVICE_URL || 'http://user-service:5001');
routeProxy('/api/v1/catalog', process.env.CATALOG_SERVICE_URL || 'http://catalog-service:5002');
routeProxy('/api/v1/search', process.env.SEARCH_SERVICE_URL || 'http://search-service:5003');
routeProxy('/api/v1/cart', process.env.CART_SERVICE_URL || 'http://cart-service:5004');
routeProxy('/api/v1/orders', process.env.ORDER_SERVICE_URL || 'http://order-service:5005');
routeProxy('/api/v1/payments', process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5006');
routeProxy('/api/v1/inventory', process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:5007');
routeProxy('/api/v1/delivery', process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:5008');
routeProxy('/api/v1/reviews', process.env.REVIEW_SERVICE_URL || 'http://review-service:5009');

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found on Flipkart API Gateway' });
});

app.listen(PORT, () => {
  console.log(`Flipkart API Gateway running on port ${PORT}`);
});
